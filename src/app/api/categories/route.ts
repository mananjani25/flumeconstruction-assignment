import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/http";

// GET /api/categories -> distinct product categories (for filter dropdowns)
export async function GET() {
  return handle(async () => {
    const rows = await prisma.product.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return ok(rows.map((r) => r.category));
  });
}
