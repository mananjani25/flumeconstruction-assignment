import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok } from "@/lib/http";

// GET /api/suppliers/:id -> supplier with full product catalog
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { products: { orderBy: { name: "asc" } } },
    });
    if (!supplier) throw new ApiError("Supplier not found", 404);
    return ok(supplier);
  });
}
