import { DomainError } from "./errors";
import { recordTransition } from "@/modules/leave-tracking/events";
import type { Database, LeaveApplication, Role, Status, User } from "./types";

/**
 * Stand-in for Flowable. Services ask for a transition; only this module
 * changes `status`, and only along the paths in this table. That single
 * path is also why no status change can miss its audit entry or notification.
 */
type Transition = { from: Status[]; to: Status; roles: Role[] };

const TRANSITIONS = {
  SUBMIT: { from: ["DRAFT", "RETURNED"], to: "SUBMITTED", roles: ["EMPLOYEE"] },
  START_REVIEW: { from: ["SUBMITTED"], to: "UNDER_REVIEW", roles: ["SUPERVISOR"] },
  APPROVE: { from: ["UNDER_REVIEW"], to: "APPROVED", roles: ["SUPERVISOR"] },
  REJECT: { from: ["UNDER_REVIEW"], to: "REJECTED", roles: ["SUPERVISOR"] },
  RETURN: { from: ["UNDER_REVIEW"], to: "RETURNED", roles: ["SUPERVISOR"] },
} satisfies Record<string, Transition>;

export type WorkflowAction = keyof typeof TRANSITIONS;

export function fire(db: Database, application: LeaveApplication, action: WorkflowAction, actor: User, comment: string | null = null) {
  const transition: Transition = TRANSITIONS[action];
  if (!transition.roles.includes(actor.role)) {
    throw new DomainError("Your role cannot take this action.");
  }
  if (!transition.from.includes(application.status)) {
    throw new DomainError("This application has moved on since you opened it. Reload the page to see its current status.");
  }

  const now = new Date().toISOString();
  const from = application.status;
  application.status = transition.to;
  application.updatedAt = now;
  if (action === "SUBMIT") application.submittedAt = now;
  if (action === "START_REVIEW") application.reviewerId = actor.id;
  if (action === "APPROVE" || action === "REJECT") application.decidedAt = now;
  recordTransition(db, { application, action, actor, from, comment });
}
