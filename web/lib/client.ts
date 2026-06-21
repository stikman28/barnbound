// Tiny client-side fetch helpers. Throw on non-2xx with the API's message.
async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || "Request failed.");
  return json as T;
}

export function apiGet<T = unknown>(url: string): Promise<T> {
  return fetch(url, { credentials: "same-origin" }).then((r) => handle<T>(r));
}

export function apiPost<T = unknown>(url: string, body?: unknown): Promise<T> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => handle<T>(r));
}

export function apiDelete<T = unknown>(url: string): Promise<T> {
  return fetch(url, { method: "DELETE", credentials: "same-origin" }).then((r) => handle<T>(r));
}

export function priceLabel(price: number): string {
  return price >= 1000 ? `$${price.toLocaleString()}` : `$${price}`;
}
