import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [suppliers, products, projects] = await Promise.all([
    prisma.supplier.count(),
    prisma.product.count(),
    prisma.project.count(),
  ]);

  const cards = [
    {
      href: "/projects",
      title: "Projects",
      blurb: "Create projects, add spec items, and source materials.",
      stat: `${projects} project${projects === 1 ? "" : "s"}`,
    },
    {
      href: "/suppliers",
      title: "Suppliers",
      blurb: "Browse the supplier directory and their product catalogs.",
      stat: `${suppliers} suppliers · ${products} products`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LiteSourcing</h1>
        <p className="mt-1 text-black/60 dark:text-white/60">
          Find the best suppliers and prices for your construction projects.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-black/10 p-5 transition-colors hover:border-blue-500 hover:bg-blue-50/40 dark:border-white/15 dark:hover:bg-white/5"
          >
            <div className="text-lg font-medium">{c.title}</div>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {c.blurb}
            </p>
            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-blue-600">
              {c.stat}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
