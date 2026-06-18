import { Badge } from "./ui";
import type { ProjectStatus } from "@/lib/format";

const styles: Record<ProjectStatus, string> = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Sourcing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Quoted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Closed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export function StatusBadge({ status }: { status: string }) {
  const style = styles[status as ProjectStatus] ?? styles.Draft;
  return <Badge className={style}>{status}</Badge>;
}
