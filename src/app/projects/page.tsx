"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/client";
import type { ProjectWithCount } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, EmptyState, Input, Label } from "@/components/ui";

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiGet<ProjectWithCount[]>("/api/projects"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Manage sourcing across your construction projects.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} variant="secondary">
          {showForm ? "Cancel" : "+ New project"}
        </Button>
      </div>

      {showForm && <NewProjectForm onDone={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-sm text-black/50">Loading…</p>
      ) : !projects?.length ? (
        <EmptyState
          title="No projects yet"
          hint="Create your first project to start sourcing."
        />
      ) : (
        <ul className="grid gap-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-black/10 p-4 transition-colors hover:border-blue-500 dark:border-white/15"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-black/55 dark:text-white/55">
                    {p.buyerName} · {p._count.specItems} spec item
                    {p._count.specItems === 1 ? "" : "s"}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", buyerName: "" });

  const mutation = useMutation({
    mutationFn: () => apiPost("/api/projects", form),
    meta: { successMessage: "Project created" },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-2 dark:border-white/15"
    >
      <label>
        <Label required>Project name</Label>
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full"
        />
      </label>
      <label>
        <Label required>Buyer / client</Label>
        <Input
          required
          value={form.buyerName}
          onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
          className="w-full"
        />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
