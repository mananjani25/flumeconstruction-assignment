"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client";
import { invalidateProjectData } from "@/lib/invalidate";
import type { ProjectDetail, SpecItem } from "@/lib/types";
import {
  formatLeadTime,
  formatMoney,
  type ProjectStatus,
} from "@/lib/format";
import { nextStatuses, summarizeProject } from "@/lib/projects";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Button,
  EmptyState,
  ErrorText,
  Input,
  Label,
  Textarea,
} from "@/components/ui";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => apiGet<ProjectDetail>(`/api/projects/${id}`),
  });

  if (isLoading) return <p className="text-sm text-black/50">Loading…</p>;
  if (isError) return <ErrorText>{(error as Error).message}</ErrorText>;
  if (!project) return null;

  return (
    <div className="space-y-6">
      <Link href="/projects" className="text-sm text-blue-600">
        ← Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-black/60 dark:text-white/60">
            {project.buyerName}
          </p>
        </div>
        <StatusControls project={project} />
      </div>

      <SummaryPanel project={project} />

      <SpecItems project={project} />
    </div>
  );
}

function SummaryPanel({ project }: { project: ProjectDetail }) {
  const s = summarizeProject(project.specItems);
  const stats = [
    { label: "Estimated cost", value: formatMoney(s.totalEstimatedCost) },
    { label: "Suppliers involved", value: String(s.supplierCount) },
    {
      label: "Longest lead time",
      value: s.longestLeadTimeDays
        ? formatLeadTime(s.longestLeadTimeDays)
        : "—",
    },
    {
      label: "Sourced",
      value: `${s.selectedCount} / ${s.specItemCount}`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((st) => (
        <div
          key={st.label}
          className="rounded-xl border border-black/10 p-4 dark:border-white/15"
        >
          <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
            {st.label}
          </div>
          <div className="mt-1 text-lg font-semibold">{st.value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusControls({ project }: { project: ProjectDetail }) {
  const qc = useQueryClient();
  const targets = nextStatuses(project.status as ProjectStatus);

  const mutation = useMutation({
    mutationFn: (status: ProjectStatus) =>
      apiPatch(`/api/projects/${project.id}`, { status }),
    onSuccess: (_data, status) => {
      toast.success(`Project moved to ${status}`);
      invalidateProjectData(qc, project.id);
    },
  });

  if (!targets.length)
    return <span className="text-sm text-black/50">Project closed</span>;

  return (
    <div className="flex gap-2">
      {targets.map((t) => (
        <Button
          key={t}
          variant="secondary"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(t)}
        >
          Move to {t}
        </Button>
      ))}
    </div>
  );
}

function SpecItems({ project }: { project: ProjectDetail }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Spec items ({project.specItems.length})
        </h2>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add spec item"}
        </Button>
      </div>

      {showForm && (
        <AddSpecItemForm
          projectId={project.id}
          onDone={() => setShowForm(false)}
        />
      )}

      {!project.specItems.length ? (
        <EmptyState
          title="No spec items"
          hint="Add the materials this project needs."
        />
      ) : (
        <ul className="grid gap-3">
          {project.specItems.map((item) => (
            <SpecItemRow key={item.id} item={item} projectId={project.id} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SpecItemRow({
  item,
  projectId,
}: {
  item: SpecItem;
  projectId: string;
}) {
  const qc = useQueryClient();
  const selected = item.options.find((o) => o.isSelected);

  const del = useMutation({
    mutationFn: () => apiDelete(`/api/spec-items/${item.id}`),
    meta: { successMessage: "Spec item deleted" },
    onSuccess: () => invalidateProjectData(qc, projectId),
  });

  return (
    <li className="rounded-xl border border-black/10 p-4 dark:border-white/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-black/55 dark:text-white/55">
            {item.quantity} {item.unitOfMeasure} · {item.category}
          </div>
          {item.description && (
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}/spec-items/${item.id}`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Source →
          </Link>
          <Button
            variant="danger"
            onClick={() => del.mutate()}
            disabled={del.isPending}
            title="Delete spec item"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="mt-3 border-t border-black/5 pt-3 text-sm dark:border-white/10">
        {selected ? (
          <span className="text-green-700 dark:text-green-400">
            ✓ Selected: {selected.product.supplier.name} —{" "}
            {formatMoney(selected.totalCost, selected.product.currency)} ·{" "}
            {formatLeadTime(selected.leadTimeDays)}
          </span>
        ) : item.options.length ? (
          <span className="text-amber-700 dark:text-amber-400">
            {item.options.length} option
            {item.options.length === 1 ? "" : "s"} — no winner selected
          </span>
        ) : (
          <span className="text-black/45 dark:text-white/45">
            No sourcing options yet
          </span>
        )}
      </div>
    </li>
  );
}

const emptySpec = {
  name: "",
  description: "",
  category: "",
  quantity: "",
  unitOfMeasure: "",
};

function AddSpecItemForm({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptySpec);

  const mutation = useMutation({
    mutationFn: () => apiPost(`/api/projects/${projectId}/spec-items`, form),
    meta: { successMessage: "Spec item added" },
    onSuccess: () => {
      invalidateProjectData(qc, projectId);
      setForm(emptySpec);
      onDone();
    },
  });

  const set =
    (k: keyof typeof emptySpec) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-2 dark:border-white/15"
    >
      <label>
        <Label>Name</Label>
        <Input
          required
          placeholder="4mm copper cable"
          value={form.name}
          onChange={set("name")}
          className="w-full"
        />
      </label>
      <label>
        <Label>Category</Label>
        <Input
          required
          placeholder="Electrical"
          value={form.category}
          onChange={set("category")}
          className="w-full"
        />
      </label>
      <label>
        <Label>Quantity</Label>
        <Input
          required
          type="number"
          step="any"
          min="0"
          value={form.quantity}
          onChange={set("quantity")}
          className="w-full"
        />
      </label>
      <label>
        <Label>Unit of measure</Label>
        <Input
          required
          placeholder="meter, piece…"
          value={form.unitOfMeasure}
          onChange={set("unitOfMeasure")}
          className="w-full"
        />
      </label>
      <label className="sm:col-span-2">
        <Label>Description (optional)</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={set("description")}
          className="w-full"
        />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Adding…" : "Add spec item"}
        </Button>
      </div>
    </form>
  );
}
