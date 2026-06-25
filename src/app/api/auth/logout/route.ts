import { handle, ok } from "@/lib/http";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";

// POST /api/auth/logout -> revoke the session and clear the cookie
export async function POST() {
  return handle(async () => {
    await destroySession();
    const res = ok({ ok: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  });
}
