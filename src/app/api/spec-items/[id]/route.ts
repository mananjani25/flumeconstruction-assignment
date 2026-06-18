import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok } from "@/lib/http";

// GET /api/spec-items/:id -> spec item with its sourcing options (for compare)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const specItem = await prisma.specItem.findUnique({
      where: { id },
      include: {
        project: true,
        options: {
          orderBy: { totalCost: "asc" },
          include: { product: { include: { supplier: true } } },
        },
      },
    });
    if (!specItem) throw new ApiError("Spec item not found", 404);
    return ok(specItem);
  });
}

// DELETE /api/spec-items/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await prisma.specItem.delete({ where: { id } });
    return ok({ deleted: true });
  });
}
