"use client";

import { startTransition, useActionState, useId, type FormEvent } from "react";
import { decideAction, startReviewAction } from "./actions";
import type { ReviewFormState } from "./schema";

function Alert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-3 border-l-4 border-tape bg-tape/10 px-3 py-2">
      {message}
    </p>
  );
}

export function StartReviewButton({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(startReviewAction, {});
  return (
    <form action={action} className="mt-8">
      <Alert message={state.error} />
      <input type="hidden" name="id" value={applicationId} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        Start review
      </button>
    </form>
  );
}

export function DecisionPanel({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(decideAction, {});
  const commentId = useId();
  const commentError = state.fieldErrors?.comment;

  // Dispatching by hand keeps the typed comment when validation fails.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 max-w-2xl border-t-2 border-file pt-5">
      <h2 className="section-title mb-3">Your decision</h2>
      <Alert message={state.error} />
      <input type="hidden" name="id" value={applicationId} />
      <label htmlFor={commentId} className="field-label">
        Comment
      </label>
      <textarea
        id={commentId}
        name="comment"
        rows={3}
        className="input"
        aria-invalid={commentError ? true : undefined}
        aria-describedby={commentError ? `${commentId}-error` : `${commentId}-hint`}
      />
      {commentError ? (
        <p id={`${commentId}-error`} className="field-error">
          {commentError}
        </p>
      ) : (
        <p id={`${commentId}-hint`} className="mt-1 text-sm text-muted">
          Required when returning an application for changes.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="submit" name="decision" value="APPROVE" disabled={pending} className="btn btn-primary">
          Approve
        </button>
        <button type="submit" name="decision" value="RETURN" disabled={pending} className="btn">
          Return for revision
        </button>
        <button type="submit" name="decision" value="REJECT" disabled={pending} className="btn btn-danger">
          Reject
        </button>
      </div>
    </form>
  );
}
