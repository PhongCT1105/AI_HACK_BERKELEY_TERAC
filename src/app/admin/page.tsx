import { Suspense } from "react";
import { PasswordGate } from "@/components/admin/PasswordGate";
import { AdminClient } from "./AdminClient";

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Admin dashboard</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <PasswordGate>
          <AdminClient />
        </PasswordGate>
      </Suspense>
    </div>
  );
}
