import type { QueryClient } from "@tanstack/react-query";

// A project's status, summary, and spec-item counts are derived from its spec
// items and their sourcing options. So any change to a spec item or option must
// invalidate not just that spec item, but the project detail and the projects
// list too — otherwise navigating back shows stale data until a manual refresh
// (cached queries stay "fresh" for `staleTime`).
export function invalidateProjectData(
  qc: QueryClient,
  projectId: string,
  specId?: string
) {
  if (specId) qc.invalidateQueries({ queryKey: ["specItem", specId] });
  qc.invalidateQueries({ queryKey: ["project", projectId] });
  qc.invalidateQueries({ queryKey: ["projects"] });
}
