import type { Database, LeaveApplication, User } from "./types";

export function supervises(db: Readonly<Database>, supervisor: User, employeeId: string) {
  return db.users.some((user) => user.id === employeeId && user.supervisorId === supervisor.id);
}

/** Drafts stay private to their author until submitted. */
export function canView(db: Readonly<Database>, user: User, application: LeaveApplication) {
  if (application.employeeId === user.id) return true;
  if (application.status === "DRAFT") return false;
  return user.role === "HR_ADMIN" || (user.role === "SUPERVISOR" && supervises(db, user, application.employeeId));
}
