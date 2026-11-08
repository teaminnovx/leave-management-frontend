import { STATUS_LABELS, type Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  DRAFT: "border-muted text-muted",
  SUBMITTED: "border-stamp text-stamp",
  UNDER_REVIEW: "border-amber text-amber",
  RETURNED: "border-tape text-tape border-dashed",
  APPROVED: "border-file bg-file text-white",
  REJECTED: "border-tape bg-tape text-white",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-[2px] border-[1.5px] px-2 text-sm font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
