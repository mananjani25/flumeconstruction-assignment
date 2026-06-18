import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, parseBodyDetailed } from "@/lib/http";
import { sourcingOptionCreateSchema } from "@/lib/validation";

// POST /api/spec-items/:id/options -> attach a supplier product as a sourcing
// option. Price/lead time default to the product's catalog values; total cost
// is computed from the spec item quantity.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const parsed = await parseBodyDetailed(req, sourcingOptionCreateSchema);
    if (!parsed.ok) return parsed.response;

    const [specItem, product] = await Promise.all([
      prisma.specItem.findUnique({ where: { id } }),
      prisma.product.findUnique({ where: { id: parsed.data.productId } }),
    ]);
    if (!specItem) throw new ApiError("Spec item not found", 404);
    if (!product) throw new ApiError("Product not found", 404);

    // Prevent attaching the same product twice.
    const existing = await prisma.sourcingOption.findFirst({
      where: { specItemId: id, productId: product.id },
    });
    if (existing) {
      throw new ApiError("This product is already a sourcing option", 409);
    }

    const quotedPrice = parsed.data.quotedPrice ?? product.unitPrice;
    const leadTimeDays = parsed.data.leadTimeDays ?? product.leadTimeDays;

    const option = await prisma.sourcingOption.create({
      data: {
        specItemId: id,
        productId: product.id,
        quotedPrice,
        leadTimeDays,
        totalCost: quotedPrice * specItem.quantity,
      },
      include: { product: { include: { supplier: true } } },
    });
    return ok(option, 201);
  });
}
