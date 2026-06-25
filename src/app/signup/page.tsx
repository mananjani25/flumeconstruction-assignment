"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/client";
import { AUTH_QUERY_KEY } from "@/lib/useAuth";
import type { AuthUser } from "@/lib/types";
import { Button, ErrorText, Input, Label } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const mutation = useMutation({
    mutationFn: () => apiPost<AuthUser>("/api/auth/signup", form),
    meta: { successMessage: "Account created" },
    onSuccess: (user) => {
      qc.setQueryData(AUTH_QUERY_KEY, { user });
      router.replace("/");
      router.refresh();
    },
  });

  const fieldErrors = (mutation.error as { details?: Record<string, string> })
    ?.details;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create account
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Set up a LiteSourcing account for your team.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <label className="block">
          <Label>Name</Label>
          <Input
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full"
          />
          <ErrorText>{fieldErrors?.name}</ErrorText>
        </label>
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
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full"
          />
          <ErrorText>
            {fieldErrors?.password ?? "At least 8 characters."}
          </ErrorText>
        </label>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="text-sm text-black/60 dark:text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
