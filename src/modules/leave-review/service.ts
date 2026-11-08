import { supervises } from "@/lib/access";
import { availableDays, PENDING_STATUSES } from "@/lib/balances";
import { read, transaction } from "@/lib/db";
import { DomainError, ValidationError } from "@/lib/errors";
import { LEAVE_TYPE_LABELS, type Database, type LeaveApplication, type User } from "@/lib/types";
import { fire } from "@/lib/workflow";
import { decisionSchema } from "./schema";

function findReviewable(db: Database, actor: User, id: string): LeaveApplication {
  const application = db.applications.find((entry) => entry.id === id);
  if (!application || !supervises(db, actor, application.employeeId)) {
    throw new DomainError("This application is not in your review queue.");
  }
  return application;
}

function deductBalance(db: Database, application: LeaveApplication) {
  const balance = db.balances.find((entry) => entry.userId === application.employeeId && entry.type === application.type);
  const available = availableDays(db, application.employeeId, application.type, application.id);
  if (!balance || application.days > available) {
    throw new DomainError(
      `${application.days} days requested but only ${Math.max(available, 0)} ${LEAVE_TYPE_LABELS[application.type]} days remain. Return or reject this application.`,
    );
  }
  balance.used += application.days;
}

/** Oldest submission first, limited to the supervisor's own team. */
export function getReviewQueue(actor: User) {
  return read((db) =>
    db.applications
      .filter((application) => PENDING_STATUSES.includes(application.status) && supervises(db, actor, application.employeeId))
      .sort((a, b) => a.submittedAt!.localeCompare(b.submittedAt!))
      .map((application) => ({
        application,
        employee: db.users.find((user) => user.id === application.employeeId)!,
      })),
  );
}

export function startReview(actor: User, id: string) {
  transaction((db) => fire(db, findReviewable(db, actor, id), "START_REVIEW", actor));
}

export function decide(actor: User, id: string, input: { decision: unknown; comment: unknown }) {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    throw new ValidationError(fieldErrors);
  }
  const { decision, comment } = parsed.data;

  transaction((db) => {
    const application = findReviewable(db, actor, id);
    if (decision === "APPROVE" && application.status === "UNDER_REVIEW") deductBalance(db, application);
    fire(db, application, decision, actor, comment || null);
    application.reviewerId = actor.id;
    application.reviewComment = comment || null;
  });
}
