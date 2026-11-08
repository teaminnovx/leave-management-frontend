import { availableDays, PENDING_STATUSES } from "@/lib/balances";
import { read, transaction } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, STATUSES, type LeaveType, type Status, type User } from "@/lib/types";

const ESCALATION_DAYS = 3;
const DAY_MS = 86_400_000;

export function getBalanceSummary(userId: string) {
  return read((db) =>
    LEAVE_TYPES.map((type) => {
      const balance = db.balances.find((entry) => entry.userId === userId && entry.type === type);
      const entitled = balance?.entitled ?? 0;
      const used = balance?.used ?? 0;
      const available = availableDays(db, userId, type);
      return { type, entitled, used, pending: entitled - used - available, available };
    }),
  );
}

export function getDashboard() {
  return read((db) => {
    const count = (statuses: Status[]) => db.applications.filter((application) => statuses.includes(application.status)).length;
    const now = Date.now();
    const person = (id?: string) => db.users.find((user) => user.id === id);

    const overdue = db.applications
      .filter((application) => PENDING_STATUSES.includes(application.status) && now - Date.parse(application.submittedAt!) > ESCALATION_DAYS * DAY_MS)
      .sort((a, b) => a.submittedAt!.localeCompare(b.submittedAt!))
      .map((application) => {
        const employee = person(application.employeeId);
        return {
          application,
          employeeName: employee?.name ?? "Unknown",
          supervisorName: person(employee?.supervisorId)?.name ?? "Unassigned",
          daysWaiting: Math.floor((now - Date.parse(application.submittedAt!)) / DAY_MS),
        };
      });

    return { pending: count(PENDING_STATUSES), approved: count(["APPROVED"]), rejected: count(["REJECTED"]), overdue, escalationDays: ESCALATION_DAYS };
  });
}

export function getBalanceSheet() {
  return read((db) =>
    db.users
      .filter((user) => user.role === "EMPLOYEE")
      .map((user) => ({
        user,
        balances: LEAVE_TYPES.map((type) => {
          const balance = db.balances.find((entry) => entry.userId === user.id && entry.type === type);
          return { type, entitled: balance?.entitled ?? 0, used: balance?.used ?? 0 };
        }),
      })),
  );
}

export function updateEntitlements(actor: User, userId: string, requested: Partial<Record<LeaveType, unknown>>) {
  if (actor.role !== "HR_ADMIN") throw new DomainError("Only HR can change leave balances.");

  transaction((db) => {
    for (const type of LEAVE_TYPES) {
      const entitled = Number(requested[type]);
      if (!Number.isInteger(entitled) || entitled < 0 || entitled > 365) {
        throw new DomainError(`Enter ${LEAVE_TYPE_LABELS[type]} days as a whole number from 0 to 365.`);
      }
      const balance = db.balances.find((entry) => entry.userId === userId && entry.type === type);
      if (!balance) throw new DomainError("This employee was not found.");

      const committed = balance.entitled - availableDays(db, userId, type);
      if (entitled < committed) {
        throw new DomainError(`${LEAVE_TYPE_LABELS[type]} cannot go below ${committed} days, which are already used or awaiting a decision.`);
      }
      balance.entitled = entitled;
    }
  });
}

export type ArchiveFilters = { q: string; type: string; status: string; from: string; to: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseArchiveFilters(get: (key: string) => string | undefined): ArchiveFilters {
  const type = get("type") ?? "";
  const status = get("status") ?? "";
  const date = (key: string) => {
    const value = get(key) ?? "";
    return DATE_PATTERN.test(value) ? value : "";
  };
  return {
    q: (get("q") ?? "").trim(),
    type: (LEAVE_TYPES as readonly string[]).includes(type) ? type : "",
    status: (STATUSES as readonly string[]).includes(status) && status !== "DRAFT" ? status : "",
    from: date("from"),
    to: date("to"),
  };
}

/** Drafts are private to their author, so the archive starts at submission. */
export function searchArchive(filters: ArchiveFilters) {
  const needle = filters.q.toLowerCase();
  return read((db) =>
    db.applications
      .filter((application) => application.status !== "DRAFT")
      .map((application) => ({
        application,
        employeeName: db.users.find((user) => user.id === application.employeeId)?.name ?? "Unknown",
      }))
      .filter(({ application, employeeName }) => {
        if (filters.type && application.type !== filters.type) return false;
        if (filters.status && application.status !== filters.status) return false;
        if (filters.from && application.endDate! < filters.from) return false;
        if (filters.to && application.startDate! > filters.to) return false;
        if (!needle) return true;
        return [application.ref, employeeName, application.reason].some((text) => text.toLowerCase().includes(needle));
      })
      .sort((a, b) => b.application.startDate!.localeCompare(a.application.startDate!)),
  );
}

export function getNotifications(userId: string) {
  return read((db) => db.notifications.filter((entry) => entry.userId === userId).sort((a, b) => b.at.localeCompare(a.at)));
}

export function markAllRead(userId: string) {
  transaction((db) => {
    for (const entry of db.notifications) {
      if (entry.userId === userId) entry.read = true;
    }
  });
}
