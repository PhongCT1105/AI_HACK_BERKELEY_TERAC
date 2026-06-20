import { NextRequest } from "next/server";

// Simple shared-secret check for admin-only API routes. Accepts the password
// via `x-admin-password` header, `?password=` query param, or JSON body field.
export function isAuthorizedAdmin(req: NextRequest, bodyPassword?: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const headerPassword = req.headers.get("x-admin-password");
  const queryPassword = req.nextUrl.searchParams.get("password");

  const provided = headerPassword ?? queryPassword ?? bodyPassword;
  return provided === expected;
}
