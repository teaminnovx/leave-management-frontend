import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { read } from "@/lib/db";
import { LEAVE_TYPE_LABELS } from "@/lib/types";
import { getBalanceSummary } from "@/modules/leave-tracking/service";

export default async function MyApplicationsPage() {
  const user = await requireRole("EMPLOYEE");
  const applications = read((db) =>
    db.applications.filter((application) => application.employeeId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  const balances = getBalanceSummary(user.id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">My applications</h1>
        <Link href="/applications/new" className="btn btn-primary">
          Apply for leave
        </Link>
      </div>

      <section className="mt-6 overflow-x-auto" aria-label="Leave balance">
        <table className="ledger">
          <thead>
            <tr>
              <th>Leave type</th>
              <th>Entitled</th>
              <th>Used</th>
              <th>Awaiting decision</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((balance) => (
              <tr key={balance.type}>
                <td>{LEAVE_TYPE_LABELS[balance.type]}</td>
                <td>{balance.entitled}</td>
                <td>{balance.used}</td>
                <td>{balance.pending}</td>
                <td className="font-semibold">{balance.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2 className="section-title mt-10">Applications</h2>
      {applications.length === 0 ? (
        <p className="mt-6 text-muted">You have no applications yet. Apply for leave to start one.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <Link href={`/applications/${application.id}`} className="font-semibold underline underline-offset-4">
                      {application.ref}
                    </Link>
                  </td>
                  <td>{LEAVE_TYPE_LABELS[application.type]}</td>
                  <td className="whitespace-nowrap">
                    {formatDate(application.startDate)} to {formatDate(application.endDate)}
                  </td>
                  <td>{application.days}</td>
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
