"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/client";
import type { SupplierWithProducts } from "@/lib/types";
import { formatLeadTime, formatMoney } from "@/lib/format";
import {
  Button,
  EmptyState,
  ErrorText,
  Input,
  Label,
} from "@/components/ui";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: supplier, isLoading, isError, error } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => apiGet<SupplierWithProducts>(`/api/suppliers/${id}`),
  });

  if (isLoading) return <p className="text-sm text-black/50">Loading…</p>;
  if (isError)
    return <ErrorText>{(error as Error).message}</ErrorText>;
  if (!supplier) return null;

  return (
    <div className="space-y-6">
      <Link href="/suppliers" className="text-sm text-blue-600">
        ← Suppliers
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {supplier.name}
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {supplier.country}
            {supplier.website && (
              <>
                {" · "}
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  website
                </a>
              </>
            )}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add product"}
        </Button>
      </div>

      {showForm && (
        <AddProductForm supplierId={id} onDone={() => setShowForm(false)} />
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
        Catalog ({supplier.products.length})
      </h2>

      {!supplier.products.length ? (
        <EmptyState title="No products yet" hint="Add the first product." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/15">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Unit price</th>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2 text-right">Lead time</th>
              </tr>
            </thead>
            <tbody>
              {supplier.products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/10"
                >
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">{p.category}</td>
                  <td className="px-4 py-2 text-right">
                    {formatMoney(p.unitPrice, p.currency)}
                  </td>
                  <td className="px-4 py-2">{p.unitOfMeasure}</td>
                  <td className="px-4 py-2 text-right">
                    {formatLeadTime(p.leadTimeDays)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const empty = {
  name: "",
  category: "",
  unitPrice: "",
  currency: "USD",
  unitOfMeasure: "",
  leadTimeDays: "",
};

function AddProductForm({
  supplierId,
  onDone,
}: {
  supplierId: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);

  const mutation = useMutation({
    mutationFn: () => apiPost(`/api/suppliers/${supplierId}/products`, form),
    meta: { successMessage: "Product added to catalog" },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier", supplierId] });
      setForm(empty);
      onDone();
    },
  });

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-3 dark:border-white/15"
    >
      <label>
        <Label>Name</Label>
        <Input required value={form.name} onChange={set("name")} className="w-full" />
      </label>
      <label>
        <Label>Category</Label>
        <Input
          required
          placeholder="Electrical, Plumbing…"
          value={form.category}
          onChange={set("category")}
          className="w-full"
        />
      </label>
      <label>
        <Label>Unit of measure</Label>
        <Input
          required
          placeholder="meter, piece, kg…"
          value={form.unitOfMeasure}
          onChange={set("unitOfMeasure")}
          className="w-full"
        />
      </label>
      <label>
        <Label>Unit price</Label>
        <Input
          required
          type="number"
          step="0.01"
          min="0"
          value={form.unitPrice}
          onChange={set("unitPrice")}
          className="w-full"
        />
      </label>
      <label>
        <Label>Currency</Label>
        <Input value={form.currency} onChange={set("currency")} className="w-full" />
      </label>
      <label>
        <Label>Lead time (days)</Label>
        <Input
          required
          type="number"
          min="0"
          value={form.leadTimeDays}
          onChange={set("leadTimeDays")}
          className="w-full"
        />
      </label>
      <div className="sm:col-span-3 flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save product"}
        </Button>
      </div>
    </form>
  );
}
