// Small JSON response helpers for route handlers.
export function ok(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function unauthorized() {
  return Response.json({ error: "You must be signed in." }, { status: 401 });
}

export function notFound(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}
