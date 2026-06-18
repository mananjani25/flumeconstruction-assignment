import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok } from "@/lib/http";

// POST /api/options/:id/select -> mark this option as the winner for its spec
// item, clearing any previously selected sibling. Atomic so a spec item never
// has two winners.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const option = await prisma.sourcingOption.findUnique({ where: { id } });
    if (!option) throw new ApiError("Sourcing option not found", 404);

    await prisma.$transaction([
      prisma.sourcingOption.updateMany({
        where: { specItemId: option.specItemId },
        data: { isSelected: false },
      }),
      prisma.sourcingOption.update({
        where: { id },
        data: { isSelected: true },
      }),
    ]);
    return ok({ selected: true });
  });
}

// DELETE /api/options/:id/select -> unselect (deselect the winner)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await prisma.sourcingOption.update({
      where: { id },
      data: { isSelected: false },
    });
    return ok({ selected: false });
  });
}
