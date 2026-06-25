import { handle, ok } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";

// GET /api/auth/me -> the currently signed-in user, or null
export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    return ok({ user });
  });
}
