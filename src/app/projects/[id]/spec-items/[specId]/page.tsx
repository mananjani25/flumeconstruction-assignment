"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/client";
import type { ProductWithSupplier, SpecItemDetail } from "@/lib/types";
import { formatLeadTime, formatMoney } from "@/lib/format";
import { Badge, Button, EmptyState, ErrorText, Input } from "@/components/ui";

export default function SourcingPage() {
  const { id: projectId, specId } = useParams<{
    id: string;
    specId: string;
  }>();

  const { data: spec, isLoading, isError, error } = useQuery({
    queryKey: ["specItem", specId],
    queryFn: () => apiGet<SpecItemDetail>(`/api/spec-items/${specId}`),
  });

  if (isLoading) return <p className="text-sm text-black/50">Loading…</p>;
  if (isError) return <ErrorText>{(error as Error).message}</ErrorText>;
  if (!spec) return null;

  return (
    <div className="space-y-6">
      <Link href={`/projects/${projectId}`} className="text-sm text-blue-600">
        ← {spec.project.name}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{spec.name}</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          {spec.quantity} {spec.unitOfMeasure} · {spec.category}
        </p>
        {spec.description && (
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            {spec.description}
          </p>
        )}
      </div>

      <OptionsCompare spec={spec} />

      {/* key by spec.id so search inputs re-init from props on navigation */}
      <ProductSearch key={spec.id} spec={spec} />
    </div>
  );
}

function OptionsCompare({ spec }: { spec: SpecItemDetail }) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["specItem", spec.id] });

  const select = useMutation({
    mutationFn: (optionId: string) =>
      apiPost(`/api/options/${optionId}/select`),
    meta: { successMessage: "Winning option selected" },
    onSuccess: invalidate,
  });
  const unselect = useMutation({
    mutationFn: (optionId: string) =>
      apiDelete(`/api/options/${optionId}/select`),
    meta: { successMessage: "Selection cleared" },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (optionId: string) => apiDelete(`/api/options/${optionId}`),
    meta: { successMessage: "Sourcing option removed" },
    onSuccess: invalidate,
  });

  const options = spec.options;
  const cheapest = options.length
    ? Math.min(...options.map((o) => o.totalCost))
    : 0;
  const fastest = options.length
    ? Math.min(...options.map((o) => o.leadTimeDays))
    : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
        Sourcing options ({options.length})
      </h2>
      {!options.length ? (
        <EmptyState
          title="No options attached yet"
          hint="Search the catalog below and attach matching products."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/15">
              <tr>
                <th className="px-4 py-2">Supplier</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2 text-right">Unit price</th>
                <th className="px-4 py-2 text-right">Total cost</th>
                <th className="px-4 py-2 text-right">Lead time</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {options.map((o) => (
                <tr
                  key={o.id}
                  className={`border-b border-black/5 last:border-0 dark:border-white/10 ${
                    o.isSelected ? "bg-green-50/60 dark:bg-green-950/20" : ""
                  }`}
                >
                  <td className="px-4 py-2">
                    {o.product.supplier.name}
                    <span className="ml-1 text-xs text-black/45">
                      ({o.product.supplier.country})
                    </span>
                  </td>
                  <td className="px-4 py-2">{o.product.name}</td>
                  <td className="px-4 py-2 text-right">
                    {formatMoney(o.quotedPrice, o.product.currency)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="font-medium">
                      {formatMoney(o.totalCost, o.product.currency)}
                    </span>
                    {o.totalCost === cheapest && (
                      <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        cheapest
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatLeadTime(o.leadTimeDays)}
                    {o.leadTimeDays === fastest && (
                      <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        fastest
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {o.isSelected ? (
                        <Button
                          variant="secondary"
                          onClick={() => unselect.mutate(o.id)}
                        >
                          ✓ Winner
                        </Button>
                      ) : (
                        <Button onClick={() => select.mutate(o.id)}>
                          Select
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        onClick={() => remove.mutate(o.id)}
                        title="Remove option"
                      >
                        ✕
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProductSearch({ spec }: { spec: SpecItemDetail }) {
  const qc = useQueryClient();
  const [q, setQ] = useState(spec.name);
  const [category, setCategory] = useState(spec.category);

  const { data: products, isFetching } = useQuery({
    queryKey: ["productSearch", q, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      return apiGet<ProductWithSupplier[]>(`/api/products?${params}`);
    },
  });

  const attachedProductIds = new Set(spec.options.map((o) => o.productId));

  const attach = useMutation({
    mutationFn: (productId: string) =>
      apiPost(`/api/spec-items/${spec.id}/options`, { productId }),
    meta: { successMessage: "Sourcing option attached" },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specItem", spec.id] }),
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
        Find matching products
      </h2>
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <Input
          placeholder="Filter by category (blank = all)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-64"
        />
        {category && (
          <Button variant="ghost" onClick={() => setCategory("")}>
            Clear category
          </Button>
        )}
      </div>

      {isFetching ? (
        <p className="text-sm text-black/50">Searching…</p>
      ) : !products?.length ? (
        <EmptyState title="No products match" hint="Try a broader search." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/15">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Supplier</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Unit price</th>
                <th className="px-4 py-2 text-right">Est. total</th>
                <th className="px-4 py-2 text-right">Lead time</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const already = attachedProductIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/10"
                  >
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">{p.supplier.name}</td>
                    <td className="px-4 py-2">{p.category}</td>
                    <td className="px-4 py-2 text-right">
                      {formatMoney(p.unitPrice, p.currency)}
                      <span className="text-xs text-black/45">
                        {" "}
                        /{p.unitOfMeasure}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatMoney(p.unitPrice * spec.quantity, p.currency)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatLeadTime(p.leadTimeDays)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="secondary"
                        disabled={already || attach.isPending}
                        onClick={() => attach.mutate(p.id)}
                      >
                        {already ? "Attached" : "Attach"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
