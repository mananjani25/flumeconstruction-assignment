import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, parseBodyDetailed } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

// POST /api/auth/login -> verify credentials, start a session
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBodyDetailed(req, loginSchema);
    if (!parsed.ok) return parsed.response;
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    // Same message whether the email or the password is wrong, to avoid
    // leaking which emails are registered.
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ApiError("Invalid email or password", 401);
    }

    const token = await createSession(user.id);
    const res = ok({ id: user.id, email: user.email, name: user.name });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  });
}
