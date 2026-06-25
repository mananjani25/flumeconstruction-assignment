"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/client";
import { useDebounce } from "@/lib/useDebounce";
import type { ProductWithSupplier } from "@/lib/types";
import { formatLeadTime, formatMoney } from "@/lib/format";
import { EmptyState, Input, Select } from "@/components/ui";

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  // Debounce the free-text query so we don't fire a request per keystroke.
  const debouncedQ = useDebounce(q);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<string[]>("/api/categories"),
  });

  const { data: products, isFetching } = useQuery({
    queryKey: ["products", debouncedQ, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (category) params.set("category", category);
      return apiGet<ProductWithSupplier[]>(`/api/products?${params}`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Every product across all suppliers — search and filter the full
          catalog.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-56"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {isFetching ? (
        <p className="text-sm text-black/50">Loading…</p>
      ) : !products?.length ? (
        <EmptyState
          title="No products found"
          hint="Try a different search or category."
        />
      ) : (
        <>
          <p className="text-xs text-black/50 dark:text-white/50">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
            <table className="w-full text-sm">
              <thead className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/15">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2 text-right">Unit price</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2 text-right">Lead time</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/10"
                  >
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/suppliers/${p.supplier.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {p.supplier.name}
                      </Link>
                      <span className="ml-1 text-xs text-black/45">
                        ({p.supplier.country})
                      </span>
                    </td>
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
        </>
      )}
    </div>
  );
}
