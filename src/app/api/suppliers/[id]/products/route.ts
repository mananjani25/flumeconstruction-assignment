import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, parseBodyDetailed } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { productCreateSchema } from "@/lib/validation";

// POST /api/suppliers/:id/products -> add a product to a supplier's catalog
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireUser();
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new ApiError("Supplier not found", 404);

    const parsed = await parseBodyDetailed(req, productCreateSchema);
    if (!parsed.ok) return parsed.response;

    const product = await prisma.product.create({
      data: { ...parsed.data, supplierId: id },
    });
    return ok(product, 201);
  });
}
