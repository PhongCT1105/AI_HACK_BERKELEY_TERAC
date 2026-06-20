"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminPassword } from "@/lib/admin-context";

export function SeedClient() {
  const password = useAdminPassword();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSeed() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to seed.");
      setStatus("done");
      setMessage(`Inserted ${data.inserted} source pairs.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to seed.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Inserts ~34 placeholder finance/crypto source-pair tasks (official/SEC/reputable sources
        vs. promotional/hype sources) for Terac annotators to label. Safe to run multiple times —
        each run adds another batch.
      </p>
      <Button onClick={handleSeed} disabled={status === "loading"} className="w-fit">
        {status === "loading" ? "Seeding…" : "Seed sample data"}
      </Button>
      {message && (
        <p className={status === "error" ? "text-sm text-destructive" : "text-sm text-green-700 dark:text-green-400"}>
          {message}
        </p>
      )}
    </div>
  );
}
