import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// GET /api/categories -> distinct product categories (for filter dropdowns)
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await prisma.product.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return ok(rows.map((r) => r.category));
  });
}
