import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/dates";
import { LEAVE_TYPE_LABELS } from "@/lib/types";
import { getReviewQueue } from "@/modules/leave-review/service";

export default async function ReviewQueuePage() {
  const user = await requireRole("SUPERVISOR");
  const queue = getReviewQueue(user);

  return (
    <>
      <h1 className="page-title">Review queue</h1>
      <p className="mt-1 text-muted">Oldest submissions first.</p>

      {queue.length === 0 ? (
        <p className="mt-6 text-muted">Your queue is clear. New applications from your team appear here.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(({ application, employee }) => (
                <tr key={application.id}>
                  <td>
                    <Link href={`/applications/${application.id}`} className="font-semibold underline underline-offset-4">
                      {application.ref}
                    </Link>
                  </td>
                  <td>{employee.name}</td>
                  <td>{LEAVE_TYPE_LABELS[application.type]}</td>
                  <td className="whitespace-nowrap">
                    {formatDate(application.startDate)} to {formatDate(application.endDate)}
                  </td>
                  <td>{application.days}</td>
                  <td className="whitespace-nowrap">{formatDateTime(application.submittedAt!)}</td>
                  <td>
                    <StatusBadge status={application.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
