import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-10 text-muted">Opening the register</p>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
