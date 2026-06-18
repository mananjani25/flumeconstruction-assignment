import type { ProjectStatus } from "./format";

// Allowed forward/backward transitions in the project lifecycle.
// Draft -> Sourcing -> Quoted -> Closed, with the ability to step back one
// stage (except out of Closed, which is terminal).
const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  Draft: ["Sourcing"],
  Sourcing: ["Draft", "Quoted"],
  Quoted: ["Sourcing", "Closed"],
  Closed: [],
};

export type SpecItemForRules = {
  options: { isSelected: boolean }[];
};

/**
 * Validate a status change. Returns an error message if the transition is not
 * allowed, otherwise null.
 */
export function validateStatusTransition(
  current: ProjectStatus,
  next: ProjectStatus,
  specItems: SpecItemForRules[]
): string | null {
  if (current === next) return null;

  if (!TRANSITIONS[current].includes(next)) {
    return `Cannot move a project from "${current}" to "${next}".`;
  }

  // Guardrail: can't start sourcing or quote without any spec items.
  if ((next === "Sourcing" || next === "Quoted") && specItems.length === 0) {
    return "Add at least one spec item before moving the project forward.";
  }

  // Guardrail: every spec item must have a selected winning option to quote.
  if (next === "Quoted") {
    const unresolved = specItems.filter(
      (s) => !s.options.some((o) => o.isSelected)
    ).length;
    if (unresolved > 0) {
      return `${unresolved} spec item${
        unresolved === 1 ? "" : "s"
      } still need a selected sourcing option before quoting.`;
    }
  }

  return null;
}

export function nextStatuses(current: ProjectStatus): ProjectStatus[] {
  return TRANSITIONS[current];
}

export type SpecItemForSummary = {
  options: {
    isSelected: boolean;
    totalCost: number;
    leadTimeDays: number;
    product: { supplierId: string };
  }[];
};

export type ProjectSummary = {
  totalEstimatedCost: number;
  supplierCount: number;
  longestLeadTimeDays: number;
  selectedCount: number;
  specItemCount: number;
};

/** Roll up selected sourcing options into project-level totals. */
export function summarizeProject(
  specItems: SpecItemForSummary[]
): ProjectSummary {
  const suppliers = new Set<string>();
  let totalEstimatedCost = 0;
  let longestLeadTimeDays = 0;
  let selectedCount = 0;

  for (const item of specItems) {
    const selected = item.options.find((o) => o.isSelected);
    if (!selected) continue;
    selectedCount += 1;
    totalEstimatedCost += selected.totalCost;
    longestLeadTimeDays = Math.max(longestLeadTimeDays, selected.leadTimeDays);
    suppliers.add(selected.product.supplierId);
  }

  return {
    totalEstimatedCost,
    supplierCount: suppliers.size,
    longestLeadTimeDays,
    selectedCount,
    specItemCount: specItems.length,
  };
}
