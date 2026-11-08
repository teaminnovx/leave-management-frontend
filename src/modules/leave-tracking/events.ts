import { randomUUID } from "node:crypto";
import type { Database, LeaveApplication, Status, User } from "@/lib/types";

type Action = "CREATE" | "SUBMIT" | "START_REVIEW" | "APPROVE" | "REJECT" | "RETURN";

const ACTION_LABELS: Record<Action, string> = {
  CREATE: "Created draft",
  SUBMIT: "Submitted",
  START_REVIEW: "Started review",
  APPROVE: "Approved",
  REJECT: "Rejected",
  RETURN: "Returned for revision",
};

const EMPLOYEE_MESSAGES: Partial<Record<Action, string>> = {
  START_REVIEW: "started reviewing",
  APPROVE: "approved",
  REJECT: "rejected",
  RETURN: "returned for revision",
};

function notify(db: Database, userId: string, applicationId: string, message: string, at: string) {
  db.notifications.push({ id: randomUUID(), userId, applicationId, message, read: false, at });
}

/** Called from the workflow inside its transaction, so the record and the change save together. */
export function recordTransition(
  db: Database,
  event: { application: LeaveApplication; action: Action; actor: User; from: Status | null; comment: string | null },
) {
  const { application, action, actor, from, comment } = event;
  const at = application.updatedAt;

  db.audit.push({
    id: randomUUID(),
    applicationId: application.id,
    actorId: actor.id,
    action: ACTION_LABELS[action],
    from,
    to: application.status,
    comment,
    at,
  });

  if (action === "SUBMIT" && actor.supervisorId) {
    notify(db, actor.supervisorId, application.id, `${actor.name} submitted ${application.ref} for review.`, at);
  }
  const verb = EMPLOYEE_MESSAGES[action];
  if (verb) notify(db, application.employeeId, application.id, `${actor.name} ${verb} your application ${application.ref}.`, at);
}
