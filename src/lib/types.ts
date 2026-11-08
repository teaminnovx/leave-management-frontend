export const ROLES = ["EMPLOYEE", "SUPERVISOR", "HR_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: "Employee",
  SUPERVISOR: "Supervisor",
  HR_ADMIN: "HR Admin",
};

export type User = {
  id: string;
  name: string;
  title: string;
  role: Role;
  supervisorId?: string;
};

export const LEAVE_TYPES = ["ANNUAL", "SICK", "CASUAL"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Annual",
  SICK: "Sick",
  CASUAL: "Casual",
};

export type Balance = {
  userId: string;
  type: LeaveType;
  entitled: number;
  used: number;
};

export const STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "RETURNED", "APPROVED", "REJECTED"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  RETURNED: "Returned",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
};

export type LeaveApplication = {
  id: string;
  ref: string;
  employeeId: string;
  type: LeaveType;
  startDate: string | null;
  endDate: string | null;
  days: number;
  reason: string;
  attachment: Attachment | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewerId: string | null;
  reviewComment: string | null;
  decidedAt: string | null;
};

export type Database = {
  users: User[];
  balances: Balance[];
  applications: LeaveApplication[];
};
