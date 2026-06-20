"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getStoredAdminPassword,
  setStoredAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-client";
import { AdminPasswordProvider } from "@/lib/admin-context";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function tryAuth(candidate: string | null) {
      if (!candidate) {
        setChecking(false);
        return;
      }
      const ok = await verifyAdminPassword(candidate);
      if (ok) {
        setStoredAdminPassword(candidate);
        setVerifiedPassword(candidate);
      }
      setChecking(false);
    }

    const queryPassword = searchParams.get("password");
    tryAuth(queryPassword ?? getStoredAdminPassword());
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      setError("Incorrect password.");
      return;
    }
    setStoredAdminPassword(password);
    setVerifiedPassword(password);
  }

  if (checking) {
    return <p className="text-sm text-zinc-500">Checking credentials…</p>;
  }

  if (!verifiedPassword) {
    return (
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
        <Label htmlFor="admin-password">Admin password</Label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-fit">
          Unlock
        </Button>
      </form>
    );
  }

  return <AdminPasswordProvider value={verifiedPassword}>{children}</AdminPasswordProvider>;
}
