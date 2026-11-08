import type { Status } from "@/lib/types";

type Stop = { label: string; reachedBy: Status[]; currentAt: Status[] };

function outcomeLabel(status: Status) {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return "Approved or rejected";
}

/** The file's routing slip: where the application is, and the loop it can go back around. */
export function RouteSlip({ status }: { status: Status }) {
  const stops: Stop[] = [
    { label: "Draft", reachedBy: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "RETURNED", "APPROVED", "REJECTED"], currentAt: ["DRAFT"] },
    { label: "Submitted", reachedBy: ["SUBMITTED", "UNDER_REVIEW", "RETURNED", "APPROVED", "REJECTED"], currentAt: ["SUBMITTED"] },
    { label: "Under review", reachedBy: ["UNDER_REVIEW", "RETURNED", "APPROVED", "REJECTED"], currentAt: ["UNDER_REVIEW"] },
    { label: outcomeLabel(status), reachedBy: ["APPROVED", "REJECTED"], currentAt: ["APPROVED", "REJECTED"] },
  ];
  const returned = status === "RETURNED";

  return (
    <div>
      <ol className="grid grid-cols-4">
        {stops.map((stop, index) => {
          const reached = stop.reachedBy.includes(status);
          const current = stop.currentAt.includes(status);
          return (
            <li key={stop.label} aria-current={current ? "step" : undefined} className="relative pt-6 text-center text-sm leading-tight">
              {index > 0 && <span aria-hidden className={`absolute left-[-50%] top-[9px] h-[3px] w-full ${reached ? "bg-tape" : "bg-line"}`} />}
              <span
                aria-hidden
                className={`absolute left-1/2 top-0 z-10 size-[21px] -translate-x-1/2 rounded-full border-[3px] ${
                  current ? "border-tape bg-sheet" : reached ? "border-tape bg-tape" : "border-line bg-sheet"
                }`}
              />
              <span className={current ? "font-semibold" : reached ? "" : "text-muted"}>{stop.label}</span>
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-4" aria-current={returned ? "step" : undefined}>
        <div
          className={`col-start-2 col-span-1 ml-[50%] w-full rounded-b-md border-x-[3px] border-b-[3px] border-dashed pt-3 text-center text-sm leading-tight ${
            returned ? "border-tape font-semibold" : "border-line text-muted"
          }`}
        >
          <span className="relative top-[1.1em] inline-block bg-sheet px-2">Returned for changes</span>
        </div>
      </div>
      <div className="h-3" />
    </div>
  );
}
