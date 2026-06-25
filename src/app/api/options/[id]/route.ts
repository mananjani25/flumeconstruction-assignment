import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// DELETE /api/options/:id -> remove a sourcing option
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireUser();
    const { id } = await params;
    await prisma.sourcingOption.delete({ where: { id } });
    return ok({ deleted: true });
  });
}
