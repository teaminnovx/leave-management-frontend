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

export type Database = {
  users: User[];
  balances: Balance[];
};
