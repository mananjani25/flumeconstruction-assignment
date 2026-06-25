"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/client";
import { AUTH_QUERY_KEY } from "@/lib/useAuth";
import type { AuthUser } from "@/lib/types";
import { Button, ErrorText, Input, Label } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const next = useSearchParams().get("next") || "/";
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: () => apiPost<AuthUser>("/api/auth/login", form),
    meta: { successMessage: "Welcome back" },
    onSuccess: (user) => {
      qc.setQueryData(AUTH_QUERY_KEY, { user });
      router.replace(next);
      router.refresh();
    },
  });

  const fieldErrors = (mutation.error as { details?: Record<string, string> })
    ?.details;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-4"
    >
      <label className="block">
        <Label>Email</Label>
        <Input
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full"
        />
        <ErrorText>{fieldErrors?.email}</ErrorText>
      </label>
      <label className="block">
        <Label>Password</Label>
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full"
        />
        <ErrorText>{fieldErrors?.password}</ErrorText>
      </label>
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Sign in to LiteSourcing to manage projects and suppliers.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-black/60 dark:text-white/60">
        No account?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
