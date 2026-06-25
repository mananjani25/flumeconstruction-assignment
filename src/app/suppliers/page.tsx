"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/client";
import { useDebounce } from "@/lib/useDebounce";
import type { SupplierWithCount } from "@/lib/types";
import { Button, EmptyState, Input, Label } from "@/components/ui";

export default function SuppliersPage() {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  // Debounce the search so typing doesn't fire a request per keystroke.
  const debouncedQ = useDebounce(q);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers", debouncedQ],
    queryFn: () =>
      apiGet<SupplierWithCount[]>(
        `/api/suppliers${debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : ""}`
      ),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Browse suppliers and their product catalogs.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} variant="secondary">
          {showForm ? "Cancel" : "+ Add supplier"}
        </Button>
      </div>

      {showForm && <AddSupplierForm onDone={() => setShowForm(false)} />}

      <Input
        placeholder="Search by name or country…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full"
      />

      {isLoading ? (
        <p className="text-sm text-black/50">Loading…</p>
      ) : !suppliers?.length ? (
        <EmptyState
          title="No suppliers found"
          hint={q ? "Try a different search." : "Add your first supplier."}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {suppliers.map((s) => (
            <li key={s.id}>
              <Link
                href={`/suppliers/${s.id}`}
                className="block rounded-xl border border-black/10 p-4 transition-colors hover:border-blue-500 dark:border-white/15"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {s.country}
                  </span>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  {s._count.products} product
                  {s._count.products === 1 ? "" : "s"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddSupplierForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", country: "", website: "" });

  const mutation = useMutation({
    mutationFn: () => apiPost("/api/suppliers", form),
    meta: { successMessage: "Supplier added" },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-3 dark:border-white/15"
    >
      <label>
        <Label required>Name</Label>
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full"
        />
      </label>
      <label>
        <Label required>Country</Label>
        <Input
          required
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          className="w-full"
        />
      </label>
      <label>
        <Label>Website (optional)</Label>
        <Input
          type="url"
          placeholder="https://…"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          className="w-full"
        />
      </label>
      <div className="sm:col-span-3 flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save supplier"}
        </Button>
      </div>
    </form>
  );
}
