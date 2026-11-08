import { today } from "./dates";
import { LEAVE_TYPES, type AuditEntry, type Balance, type Database, type LeaveApplication, type LeaveType, type Status, type User } from "./types";

const USERS: User[] = [
  { id: "u-farhana", name: "Farhana Akter", title: "Program Officer", role: "EMPLOYEE", supervisorId: "u-nasrin" },
  { id: "u-tanvir", name: "Tanvir Hasan", title: "Accounts Officer", role: "EMPLOYEE", supervisorId: "u-nasrin" },
  { id: "u-imran", name: "Imran Chowdhury", title: "Systems Analyst", role: "EMPLOYEE", supervisorId: "u-kamal" },
  { id: "u-nusrat", name: "Nusrat Jahan", title: "Research Officer", role: "EMPLOYEE", supervisorId: "u-kamal" },
  { id: "u-nasrin", name: "Nasrin Sultana", title: "Deputy Director, Programs", role: "SUPERVISOR" },
  { id: "u-kamal", name: "Kamal Uddin", title: "Deputy Director, Systems", role: "SUPERVISOR" },
  { id: "u-shirin", name: "Shirin Ahmed", title: "HR Manager", role: "HR_ADMIN" },
];

const ENTITLEMENT: Record<LeaveType, number> = { ANNUAL: 20, SICK: 14, CASUAL: 10 };

type Sample = {
  employeeId: string;
  type: LeaveType;
  startsIn: number;
  days: number;
  reason: string;
  status: Status;
  submittedDaysAgo: number;
  comment?: string;
};

/** Enough history for the HR overview to have something to show, including overdue reviews. */
const SAMPLES: Sample[] = [
  { employeeId: "u-farhana", type: "ANNUAL", startsIn: -40, days: 5, reason: "Family wedding in Chattogram", status: "APPROVED", submittedDaysAgo: 55 },
  { employeeId: "u-imran", type: "ANNUAL", startsIn: -25, days: 4, reason: "Travel during the release window", status: "REJECTED", submittedDaysAgo: 32, comment: "The release needs you that week." },
  { employeeId: "u-nusrat", type: "SICK", startsIn: -15, days: 2, reason: "Fever, advised rest by doctor", status: "APPROVED", submittedDaysAgo: 16 },
  { employeeId: "u-tanvir", type: "ANNUAL", startsIn: 9, days: 3, reason: "Visiting parents in Rajshahi", status: "UNDER_REVIEW", submittedDaysAgo: 5 },
  { employeeId: "u-imran", type: "SICK", startsIn: 2, days: 2, reason: "Scheduled minor eye surgery", status: "SUBMITTED", submittedDaysAgo: 4 },
  { employeeId: "u-nusrat", type: "CASUAL", startsIn: 6, days: 1, reason: "School admission for my child", status: "SUBMITTED", submittedDaysAgo: 1 },
  { employeeId: "u-tanvir", type: "CASUAL", startsIn: 12, days: 2, reason: "Personal errands", status: "RETURNED", submittedDaysAgo: 2, comment: "Please say which errands need two full days." },
];

const DAY_MS = 86_400_000;
const STEP_LABELS: Partial<Record<Status, string>> = { APPROVED: "Approved", REJECTED: "Rejected", RETURNED: "Returned for revision" };

function shiftDate(date: string, days: number) {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

function buildSample(sample: Sample, index: number, users: User[]) {
  const id = `seed-${index + 1}`;
  const reviewerId = users.find((user) => user.id === sample.employeeId)!.supervisorId!;
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY_MS).toISOString();
  const start = shiftDate(today(), sample.startsIn);
  const decided = sample.status === "APPROVED" || sample.status === "REJECTED";
  const reviewed = sample.status !== "SUBMITTED";
  const finishedDaysAgo = Math.max(sample.submittedDaysAgo - 1, 0);

  const application: LeaveApplication = {
    id,
    ref: `LV-${String(index + 1).padStart(4, "0")}`,
    employeeId: sample.employeeId,
    type: sample.type,
    startDate: start,
    endDate: shiftDate(start, sample.days - 1),
    days: sample.days,
    reason: sample.reason,
    attachment: null,
    status: sample.status,
    createdAt: at(sample.submittedDaysAgo),
    updatedAt: at(reviewed ? finishedDaysAgo : sample.submittedDaysAgo),
    submittedAt: at(sample.submittedDaysAgo),
    reviewerId: reviewed ? reviewerId : null,
    reviewComment: sample.comment ?? null,
    decidedAt: decided ? at(finishedDaysAgo) : null,
  };

  const entry = (step: number, actorId: string, action: string, from: Status | null, to: Status, daysAgo: number, comment: string | null = null): AuditEntry => ({
    id: `${id}-audit-${step}`,
    applicationId: id,
    actorId,
    action,
    from,
    to,
    comment,
    at: at(daysAgo),
  });

  const audit = [
    entry(1, sample.employeeId, "Created draft", null, "DRAFT", sample.submittedDaysAgo),
    entry(2, sample.employeeId, "Submitted", "DRAFT", "SUBMITTED", sample.submittedDaysAgo),
  ];
  if (reviewed) audit.push(entry(3, reviewerId, "Started review", "SUBMITTED", "UNDER_REVIEW", finishedDaysAgo));
  const label = STEP_LABELS[sample.status];
  if (label) audit.push(entry(4, reviewerId, label, "UNDER_REVIEW", sample.status, finishedDaysAgo, sample.comment ?? null));

  return { application, audit };
}

export function createSeed(): Database {
  const balances: Balance[] = USERS.filter((user) => user.role === "EMPLOYEE").flatMap((user) =>
    LEAVE_TYPES.map((type) => ({ userId: user.id, type, entitled: ENTITLEMENT[type], used: 0 })),
  );
  const built = SAMPLES.map((sample, index) => buildSample(sample, index, USERS));

  for (const { application } of built) {
    if (application.status !== "APPROVED") continue;
    balances.find((entry) => entry.userId === application.employeeId && entry.type === application.type)!.used += application.days;
  }

  return {
    users: USERS,
    balances,
    applications: built.map((item) => item.application),
    audit: built.flatMap((item) => item.audit),
    notifications: [],
  };
}
