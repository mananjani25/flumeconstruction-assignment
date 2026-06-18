import { prisma } from "@/lib/prisma";
import { handle, ok, parseBodyDetailed } from "@/lib/http";
import { projectCreateSchema } from "@/lib/validation";

// GET /api/projects -> list projects with spec item counts
export async function GET() {
  return handle(async () => {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { specItems: true } } },
    });
    return ok(projects);
  });
}

// POST /api/projects -> create a project (starts in Draft)
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBodyDetailed(req, projectCreateSchema);
    if (!parsed.ok) return parsed.response;
    const project = await prisma.project.create({ data: parsed.data });
    return ok(project, 201);
  });
}
