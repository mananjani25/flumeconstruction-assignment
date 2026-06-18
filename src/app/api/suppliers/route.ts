import { prisma } from "@/lib/prisma";
import { handle, ok, parseBodyDetailed } from "@/lib/http";
import { supplierCreateSchema } from "@/lib/validation";

// GET /api/suppliers?q=  -> list suppliers (with product counts), optional search
export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const suppliers = await prisma.supplier.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { country: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return ok(suppliers);
  });
}

// POST /api/suppliers -> create a supplier
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBodyDetailed(req, supplierCreateSchema);
    if (!parsed.ok) return parsed.response;
    const supplier = await prisma.supplier.create({ data: parsed.data });
    return ok(supplier, 201);
  });
}
