import Link from "next/link";
import { notFound } from "next/navigation";
import { RouteSlip } from "@/components/route-slip";
import { StatusBadge } from "@/components/status-badge";
import { canView, supervises } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { read } from "@/lib/db";
import { LEAVE_TYPE_LABELS } from "@/lib/types";
import { EDITABLE_STATUSES } from "@/modules/leave-request/service";
import { DecisionPanel, StartReviewButton } from "@/modules/leave-review/review-panel";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = read((db) => {
    const application = db.applications.find((entry) => entry.id === id);
    if (!application || !canView(db, user, application)) return null;
    return {
      application,
      employee: db.users.find((entry) => entry.id === application.employeeId),
      reviewer: db.users.find((entry) => entry.id === application.reviewerId),
      canReview: user.role === "SUPERVISOR" && supervises(db, user, application.employeeId),
    };
  });
  if (!data) notFound();

  const { application, employee, reviewer, canReview } = data;
  const editable = application.employeeId === user.id && EDITABLE_STATUSES.includes(application.status);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="page-title">{application.ref}</h1>
        <StatusBadge status={application.status} />
        {editable && (
          <Link href={`/applications/${application.id}/edit`} className="btn ml-auto">
            {application.status === "RETURNED" ? "Revise and resubmit" : "Edit draft"}
          </Link>
        )}
      </div>

      <section aria-label="Application progress" className="mt-6 rounded-[3px] border border-line bg-sheet px-2 pt-5 pb-3 sm:px-6">
        <RouteSlip status={application.status} />
      </section>

      {application.reviewComment && (
        <section className="mt-6 max-w-2xl border-l-4 border-tape bg-sheet px-4 py-3">
          <h2 className="font-semibold">{reviewer ? `Comment from ${reviewer.name}` : "Reviewer comment"}</h2>
          <p className="mt-1 whitespace-pre-wrap">{application.reviewComment}</p>
        </section>
      )}

      <dl className="detail-list mt-8 max-w-2xl">
        <dt>Employee</dt>
        <dd>
          {employee?.name}, {employee?.title}
        </dd>
        <dt>Leave type</dt>
        <dd>{LEAVE_TYPE_LABELS[application.type]}</dd>
        <dt>Dates</dt>
        <dd>
          {formatDate(application.startDate)} to {formatDate(application.endDate)} ({application.days} {application.days === 1 ? "day" : "days"})
        </dd>
        <dt>Reason</dt>
        <dd className="whitespace-pre-wrap">{application.reason || "Not given yet"}</dd>
        <dt>Document</dt>
        <dd>
          {application.attachment ? (
            <a href={`/api/files/${application.attachment.id}`} className="underline underline-offset-4">
              {application.attachment.name}
            </a>
          ) : (
            "None attached"
          )}
        </dd>
      </dl>

      {canReview && application.status === "SUBMITTED" && <StartReviewButton applicationId={application.id} />}
      {canReview && application.status === "UNDER_REVIEW" && <DecisionPanel key={application.updatedAt} applicationId={application.id} />}
    </>
  );
}
