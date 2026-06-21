"use client";

import { createContext, useContext } from "react";

const AdminPasswordContext = createContext<string | null>(null);

export const AdminPasswordProvider = AdminPasswordContext.Provider;

export function useAdminPassword(): string {
  const password = useContext(AdminPasswordContext);
  if (!password) {
    throw new Error("useAdminPassword must be used within an authorized PasswordGate.");
  }
  return password;
}
