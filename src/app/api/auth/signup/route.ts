import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, parseBodyDetailed } from "@/lib/http";
import { signupSchema } from "@/lib/validation";
import {
  createSession,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

// POST /api/auth/signup -> create a user, sign them in
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBodyDetailed(req, signupSchema);
    if (!parsed.ok) return parsed.response;
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError("Email is already registered", 409);

    const user = await prisma.user.create({
      data: { name, email, passwordHash: hashPassword(password) },
    });

    const token = await createSession(user.id);
    const res = ok(
      { id: user.id, email: user.email, name: user.name },
      201
    );
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  });
}
