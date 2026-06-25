import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, parseBodyDetailed } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { projectStatusSchema } from "@/lib/validation";
import { validateStatusTransition } from "@/lib/projects";
import type { ProjectStatus } from "@/lib/format";

// GET /api/projects/:id -> project with spec items and their options
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireUser();
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        specItems: {
          orderBy: { createdAt: "asc" },
          include: {
            options: { include: { product: { include: { supplier: true } } } },
          },
        },
      },
    });
    if (!project) throw new ApiError("Project not found", 404);
    return ok(project);
  });
}

// PATCH /api/projects/:id -> move project through its lifecycle (guarded)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireUser();
    const { id } = await params;
    const parsed = await parseBodyDetailed(req, projectStatusSchema);
    if (!parsed.ok) return parsed.response;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { specItems: { include: { options: true } } },
    });
    if (!project) throw new ApiError("Project not found", 404);

    const error = validateStatusTransition(
      project.status as ProjectStatus,
      parsed.data.status,
      project.specItems
    );
    if (error) throw new ApiError(error, 409);

    const updated = await prisma.project.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return ok(updated);
  });
}

// DELETE /api/projects/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireUser();
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return ok({ deleted: true });
  });
}
