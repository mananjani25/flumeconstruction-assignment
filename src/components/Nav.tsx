"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/client";
import { AUTH_QUERY_KEY, useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/products", label: "Products" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();

  const logout = useMutation({
    mutationFn: () => apiPost("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(AUTH_QUERY_KEY, { user: null });
      qc.clear();
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Lite<span className="text-blue-600">Sourcing</span>
        </Link>
        {user && (
          <div className="flex gap-1">
            {links.map((l) => {
              const active =
                pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
        {user && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-black/60 dark:text-white/60">
              {user.name}
            </span>
            <Button
              variant="secondary"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              {logout.isPending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
