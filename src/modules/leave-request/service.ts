import { randomUUID } from "node:crypto";
import { availableDays, PENDING_STATUSES } from "@/lib/balances";
import { countDays, today } from "@/lib/dates";
import { transaction } from "@/lib/db";
import { DomainError, ValidationError } from "@/lib/errors";
import { LEAVE_TYPE_LABELS, type Attachment, type Database, type LeaveApplication, type LeaveType, type Status, type User } from "@/lib/types";
import { fire } from "@/lib/workflow";
import { draftSchema, submitSchema } from "./schema";
import { deleteAttachment, storeAttachment } from "./storage";

export type Intent = "draft" | "submit";

export type SaveCommand = {
  id?: string;
  intent: Intent;
  fields: { type: unknown; startDate: unknown; endDate: unknown; reason: unknown };
  file: File | null;
};

export const EDITABLE_STATUSES: Status[] = ["DRAFT", "RETURNED"];
const OVERLAP_STATUSES: Status[] = [...PENDING_STATUSES, "APPROVED"];

function parseFields(command: SaveCommand) {
  const schema = command.intent === "submit" ? submitSchema : draftSchema;
  const parsed = schema.safeParse(command.fields);
  if (parsed.success) return parsed.data;

  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    fieldErrors[String(issue.path[0])] ??= issue.message;
  }
  throw new ValidationError(fieldErrors);
}

function assertSubmittable(db: Database, application: LeaveApplication) {
  const { startDate, endDate, type, days, employeeId, id } = application as LeaveApplication & { startDate: string; endDate: string };

  if (startDate < today()) throw new DomainError("Start date cannot be in the past.", "startDate");

  const clash = db.applications.find(
    (other) =>
      other.id !== id &&
      other.employeeId === employeeId &&
      OVERLAP_STATUSES.includes(other.status) &&
      other.startDate! <= endDate &&
      startDate <= other.endDate!,
  );
  if (clash) throw new DomainError(`These dates overlap with application ${clash.ref}.`, "startDate");

  const available = availableDays(db, employeeId, type, id);
  if (days > available) {
    throw new DomainError(`You asked for ${days} days but have ${Math.max(available, 0)} ${LEAVE_TYPE_LABELS[type]} days available.`, "type");
  }
}

function createApplication(db: Database, actor: User, type: LeaveType): LeaveApplication {
  const now = new Date().toISOString();
  const application: LeaveApplication = {
    id: randomUUID(),
    ref: `LV-${String(db.applications.length + 1).padStart(4, "0")}`,
    employeeId: actor.id,
    type,
    startDate: null,
    endDate: null,
    days: 0,
    reason: "",
    attachment: null,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
  };
  db.applications.push(application);
  return application;
}

function findEditable(db: Database, actor: User, id: string) {
  const application = db.applications.find((entry) => entry.id === id && entry.employeeId === actor.id);
  if (!application) throw new DomainError("This application was not found.");
  if (!EDITABLE_STATUSES.includes(application.status)) {
    throw new DomainError("Only draft or returned applications can be changed.");
  }
  return application;
}

export async function saveApplication(actor: User, command: SaveCommand): Promise<string> {
  const fields = parseFields(command);
  const newAttachment = command.file ? await storeAttachment(command.file) : null;

  let replaced: Attachment | null = null;
  try {
    const id = transaction((db) => {
      const application = command.id ? findEditable(db, actor, command.id) : createApplication(db, actor, fields.type);

      application.type = fields.type;
      application.startDate = fields.startDate;
      application.endDate = fields.endDate;
      application.days = fields.startDate && fields.endDate ? countDays(fields.startDate, fields.endDate) : 0;
      application.reason = fields.reason;
      application.updatedAt = new Date().toISOString();
      if (newAttachment) {
        replaced = application.attachment;
        application.attachment = newAttachment;
      }

      if (command.intent === "submit") {
        assertSubmittable(db, application);
        fire(application, "SUBMIT", actor);
      }
      return application.id;
    });
    if (replaced) deleteAttachment(replaced);
    return id;
  } catch (error) {
    if (newAttachment) deleteAttachment(newAttachment);
    throw error;
  }
}
