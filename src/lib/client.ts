// Tiny client-side fetch wrapper. Throws an Error with the server's message so
// callers can surface it directly in the UI.

export async function apiRequest<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    const message =
      (body && (body.error as string)) || `Request failed (${res.status})`;
    const err = new Error(message) as Error & { details?: unknown };
    err.details = body?.details;
    throw err;
  }
  return body as T;
}

export const apiGet = <T>(url: string) => apiRequest<T>(url);
export const apiPost = <T>(url: string, data?: unknown) =>
  apiRequest<T>(url, { method: "POST", body: JSON.stringify(data ?? {}) });
export const apiPatch = <T>(url: string, data?: unknown) =>
  apiRequest<T>(url, { method: "PATCH", body: JSON.stringify(data ?? {}) });
export const apiDelete = <T>(url: string) =>
  apiRequest<T>(url, { method: "DELETE" });
