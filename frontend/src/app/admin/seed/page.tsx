import { Suspense } from "react";
import Link from "next/link";
import { PasswordGate } from "@/components/admin/PasswordGate";
import { SeedClient } from "./SeedClient";

export default function AdminSeedPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Optional future: seed source-pair samples
        </h1>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <PasswordGate>
          <SeedClient />
        </PasswordGate>
      </Suspense>
    </div>
  );
}
