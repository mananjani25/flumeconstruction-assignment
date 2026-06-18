"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { Toaster, toast } from "sonner";

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 10_000, retry: 1 } },
    // Surface every failed fetch as a toast, app-wide.
    queryCache: new QueryCache({
      onError: (error) => toast.error((error as Error).message),
    }),
    // Surface mutation failures as error toasts, and show a success toast when
    // a mutation declares one via `meta.successMessage`.
    mutationCache: new MutationCache({
      onError: (error) => toast.error((error as Error).message),
      onSuccess: (_data, _vars, _ctx, mutation) => {
        const message = mutation.meta?.successMessage as string | undefined;
        if (message) toast.success(message);
      },
    }),
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
