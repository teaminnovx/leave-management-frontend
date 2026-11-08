import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, STATUSES, STATUS_LABELS } from "@/lib/types";
import { parseArchiveFilters, searchArchive } from "@/modules/leave-tracking/service";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HrArchivePage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("HR_ADMIN");
  const params = await searchParams;
  const filters = parseArchiveFilters((key) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  });
  const results = searchArchive(filters);
  const exportQuery = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Leave archive</h1>
        <a href={`/hr/archive/export${exportQuery ? `?${exportQuery}` : ""}`} className="btn">
          Download CSV
        </a>
      </div>

      <form method="get" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-5">
          <label htmlFor="q" className="field-label">
            Search by name, reference or reason
          </label>
          <input id="q" name="q" type="search" defaultValue={filters.q} className="input" />
        </div>
        <div>
          <label htmlFor="filter-type" className="field-label">
            Leave type
          </label>
          <select id="filter-type" name="type" defaultValue={filters.type} className="input">
            <option value="">All types</option>
            {LEAVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {LEAVE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-status" className="field-label">
            Status
          </label>
          <select id="filter-status" name="status" defaultValue={filters.status} className="input">
            <option value="">All statuses</option>
            {STATUSES.filter((status) => status !== "DRAFT").map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="field-label">
            On leave from
          </label>
          <input id="from" name="from" type="date" defaultValue={filters.from} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="field-label">
            To
          </label>
          <input id="to" name="to" type="date" defaultValue={filters.to} className="input" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn btn-primary">
            Search archive
          </button>
        </div>
      </form>

      {results.length === 0 ? (
        <p className="mt-8">No applications match this search. Remove a filter to see more.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ application, employeeName }) => (
                <tr key={application.id}>
                  <td>
                    <Link href={`/applications/${application.id}`} className="font-semibold underline underline-offset-4">
                      {application.ref}
                    </Link>
                  </td>
                  <td>{employeeName}</td>
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
