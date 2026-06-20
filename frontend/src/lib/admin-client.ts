const STORAGE_KEY = "sourceguard_admin_password";

export function getStoredAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function setStoredAdminPassword(password: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, password);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const res = await fetch("/api/results", {
    headers: { "x-admin-password": password },
    cache: "no-store",
  });
  return res.ok;
}
