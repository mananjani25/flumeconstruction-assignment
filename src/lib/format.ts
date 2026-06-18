// Small display helpers shared across the UI.

export function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatLeadTime(days: number) {
  return `${days} day${days === 1 ? "" : "s"}`;
}

export const PROJECT_STATUSES = [
  "Draft",
  "Sourcing",
  "Quoted",
  "Closed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
