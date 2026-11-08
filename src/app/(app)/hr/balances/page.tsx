import { requireRole } from "@/lib/auth";
import { BalanceRow } from "@/modules/leave-tracking/balance-row";
import { getBalanceSheet } from "@/modules/leave-tracking/service";

export default async function HrBalancesPage() {
  await requireRole("HR_ADMIN");
  const sheet = getBalanceSheet();

  return (
    <>
      <h1 className="page-title">Leave balances</h1>
      <p className="mt-1 text-muted">Set how many days each employee is entitled to per leave type.</p>
      <div className="mt-4 border-t-2 border-file">
        {sheet.map(({ user, balances }) => (
          <BalanceRow
            key={`${user.id}-${balances.map((balance) => balance.entitled).join("-")}`}
            userId={user.id}
            name={user.name}
            title={user.title}
            balances={balances}
          />
        ))}
      </div>
    </>
  );
}
