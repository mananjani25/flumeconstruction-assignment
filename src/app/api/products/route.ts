import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// GET /api/products?q=&category=  -> search across ALL suppliers' products.
// Powers the sourcing workflow (finding matches for a spec item).
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();
    const params = new URL(req.url).searchParams;
    const q = params.get("q")?.trim();
    const category = params.get("category")?.trim();

    const products = await prisma.product.findMany({
      where: {
        AND: [
          q ? { name: { contains: q } } : {},
          category ? { category } : {},
        ],
      },
      orderBy: [{ name: "asc" }],
      include: { supplier: { select: { id: true, name: true, country: true } } },
      take: 500,
    });
    return ok(products);
  });
}
