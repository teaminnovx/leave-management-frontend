import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { getDashboard } from "@/modules/leave-tracking/service";

export default async function HrOverviewPage() {
  await requireRole("HR_ADMIN");
  const { pending, approved, rejected, overdue, escalationDays } = getDashboard();
  const tallies = [
    { label: "Pending", value: pending },
    { label: "Approved", value: approved },
    { label: "Rejected", value: rejected },
  ];

  return (
    <>
      <h1 className="page-title">Overview</h1>

      <dl className="mt-6 flex divide-x divide-line border-y-2 border-file bg-sheet">
        {tallies.map((tally) => (
          <div key={tally.label} className="flex-1 px-4 py-3">
            <dt className="text-muted">{tally.label}</dt>
            <dd className="font-display text-4xl font-semibold">{tally.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="section-title">Overdue reviews</h2>
        <p className="text-muted">Waiting on a supervisor for more than {escalationDays} days since submission.</p>
        {overdue.length === 0 ? (
          <p className="mt-4">Every submitted application is within the review window.</p>
        ) : (
          <div className="mt-3 overflow-x-auto border-l-[6px] border-tape">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Employee</th>
                  <th>Waiting on</th>
                  <th>Submitted</th>
                  <th>Days waiting</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map(({ application, employeeName, supervisorName, daysWaiting }) => (
                  <tr key={application.id}>
                    <td>
                      <Link href={`/applications/${application.id}`} className="font-semibold underline underline-offset-4">
                        {application.ref}
                      </Link>
                    </td>
                    <td>{employeeName}</td>
                    <td>{supervisorName}</td>
                    <td className="whitespace-nowrap">{formatDateTime(application.submittedAt!)}</td>
                    <td className="font-semibold">{daysWaiting}</td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
