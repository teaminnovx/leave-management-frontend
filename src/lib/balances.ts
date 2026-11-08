import type { Database, LeaveType, Status } from "./types";

export const PENDING_STATUSES: Status[] = ["SUBMITTED", "UNDER_REVIEW"];

/** Days left once approved leave and applications awaiting a decision are counted. */
export function availableDays(db: Readonly<Database>, userId: string, type: LeaveType, excludeApplicationId?: string) {
  const balance = db.balances.find((entry) => entry.userId === userId && entry.type === type);
  if (!balance) return 0;

  const pending = db.applications
    .filter(
      (application) =>
        application.employeeId === userId &&
        application.type === type &&
        application.id !== excludeApplicationId &&
        PENDING_STATUSES.includes(application.status),
    )
    .reduce((total, application) => total + application.days, 0);

  return balance.entitled - balance.used - pending;
}
