"use client";

import { useActionState } from "react";
import { LEAVE_TYPE_LABELS, type LeaveType } from "@/lib/types";
import { saveBalances, type BalanceFormState } from "./actions";

type Props = {
  userId: string;
  name: string;
  title: string;
  balances: { type: LeaveType; entitled: number; used: number }[];
};

export function BalanceRow({ userId, name, title, balances }: Props) {
  const [state, action, pending] = useActionState<BalanceFormState, FormData>(saveBalances, {});

  return (
    <form action={action} className="border-b border-line py-4">
      <input type="hidden" name="userId" value={userId} />
      <p className="font-semibold leading-snug">{name}</p>
      <p className="text-sm text-muted">{title}</p>
      <div className="mt-2 flex flex-wrap items-end gap-4">
        {balances.map((balance) => (
          <label key={balance.type} className="block w-32">
            <span className="field-label">{LEAVE_TYPE_LABELS[balance.type]}</span>
            <input name={balance.type} type="number" min={0} max={365} defaultValue={balance.entitled} className="input" />
            <span className="mt-1 block text-sm text-muted">{balance.used} used</span>
          </label>
        ))}
        <button type="submit" disabled={pending} className="btn mb-7">
          Save balances
        </button>
      </div>
      {state.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      {state.saved && <p role="status" className="text-sm text-file">Balances saved.</p>}
    </form>
  );
}
