import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, parseBodyDetailed } from "@/lib/http";
import { specItemCreateSchema } from "@/lib/validation";

// POST /api/projects/:id/spec-items -> add a spec item to a project
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new ApiError("Project not found", 404);

    const parsed = await parseBodyDetailed(req, specItemCreateSchema);
    if (!parsed.ok) return parsed.response;

    const specItem = await prisma.specItem.create({
      data: { ...parsed.data, projectId: id },
    });
    return ok(specItem, 201);
  });
}
