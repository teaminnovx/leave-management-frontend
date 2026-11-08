"use client";

import { startTransition, useActionState, useId, useState, type FormEvent } from "react";
import { countDays } from "@/lib/dates";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, type LeaveApplication, type LeaveType } from "@/lib/types";
import { saveLeaveApplication } from "./actions";
import type { LeaveFormState } from "./schema";

type Props = {
  application?: LeaveApplication;
  available: Record<LeaveType, number>;
  today: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      {message}
    </p>
  );
}

export function LeaveForm({ application, available, today }: Props) {
  const [state, action, pending] = useActionState<LeaveFormState, FormData>(saveLeaveApplication, {});
  const [startDate, setStartDate] = useState(application?.startDate ?? "");
  const [endDate, setEndDate] = useState(application?.endDate ?? "");
  const errors = state.fieldErrors ?? {};
  // Next keeps visited routes mounted but hidden, so fixed ids would collide across forms.
  const uid = useId();
  const fieldId = (field: string) => `${uid}-${field}`;
  const days = startDate && endDate && endDate >= startDate ? countDays(startDate, endDate) : 0;

  // Dispatching by hand keeps the fields, including the chosen file, when validation fails.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(data));
  }

  const describe = (field: string) => (errors[field] ? { "aria-invalid": true, "aria-describedby": `${fieldId(field)}-error` } : {});

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-5">
      {application && <input type="hidden" name="id" value={application.id} />}

      {state.error && (
        <p role="alert" className="border-l-4 border-tape bg-tape/10 px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor={fieldId("type")} className="field-label">
          Leave type
        </label>
        <select id={fieldId("type")} name="type" className="input" defaultValue={application?.type ?? "ANNUAL"} {...describe("type")}>
          {LEAVE_TYPES.map((type) => (
            <option key={type} value={type}>
              {LEAVE_TYPE_LABELS[type]} ({available[type]} days available)
            </option>
          ))}
        </select>
        <FieldError id={`${fieldId("type")}-error`} message={errors.type} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={fieldId("startDate")} className="field-label">
            Start date
          </label>
          <input
            id={fieldId("startDate")}
            name="startDate"
            type="date"
            min={today}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="input"
            {...describe("startDate")}
          />
          <FieldError id={`${fieldId("startDate")}-error`} message={errors.startDate} />
        </div>
        <div>
          <label htmlFor={fieldId("endDate")} className="field-label">
            End date
          </label>
          <input
            id={fieldId("endDate")}
            name="endDate"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="input"
            {...describe("endDate")}
          />
          <FieldError id={`${fieldId("endDate")}-error`} message={errors.endDate} />
        </div>
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {days > 0 ? `${days} ${days === 1 ? "day" : "days"}, counting weekends and holidays` : "Every calendar day in the range counts as leave."}
      </p>

      <div>
        <label htmlFor={fieldId("reason")} className="field-label">
          Reason
        </label>
        <textarea id={fieldId("reason")} name="reason" rows={4} className="input" defaultValue={application?.reason} {...describe("reason")} />
        <FieldError id={`${fieldId("reason")}-error`} message={errors.reason} />
      </div>

      <div>
        <label htmlFor={fieldId("attachment")} className="field-label">
          Supporting document (optional)
        </label>
        <input id={fieldId("attachment")} name="attachment" type="file" accept=".pdf,.png,.jpg,.jpeg" className="input" {...describe("attachment")} />
        <p className="mt-1 text-sm text-muted">
          {application?.attachment
            ? `Currently attached: ${application.attachment.name}. Choosing a new file replaces it.`
            : "A medical certificate, for example. PDF, PNG or JPEG, up to 5 MB."}
        </p>
        <FieldError id={`${fieldId("attachment")}-error`} message={errors.attachment} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="submit" disabled={pending} className="btn btn-primary">
          {application?.status === "RETURNED" ? "Resubmit application" : "Submit application"}
        </button>
        <button type="submit" name="intent" value="draft" disabled={pending} className="btn">
          Save draft
        </button>
      </div>
    </form>
  );
}
