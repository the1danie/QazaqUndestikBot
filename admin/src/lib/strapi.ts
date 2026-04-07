const STRAPI_URL = process.env.STRAPI_URL!;
const TOKEN = process.env.STRAPI_API_TOKEN!;

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
}

export async function strapiList<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = new URL(`/api/${path}`, STRAPI_URL);
  url.searchParams.set("pagination[pageSize]", "100");
  url.searchParams.set("publicationState", "preview");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T[] };
  return json.data;
}

export async function strapiCreate<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(new URL(`/api/${path}`, STRAPI_URL).toString(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ data }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T };
  return json.data;
}

export async function strapiUpdate<T>(path: string, documentId: string, data: unknown): Promise<T> {
  const res = await fetch(new URL(`/api/${path}/${documentId}`, STRAPI_URL).toString(), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ data }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T };
  return json.data;
}

export async function strapiDelete(path: string, documentId: string): Promise<void> {
  const res = await fetch(new URL(`/api/${path}/${documentId}`, STRAPI_URL).toString(), {
    method: "DELETE",
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
}

export async function strapiPublish(path: string, documentId: string): Promise<void> {
  const res = await fetch(
    new URL(`/api/${path}/${documentId}/actions/publish`, STRAPI_URL).toString(),
    { method: "POST", headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Strapi publish ${res.status}: ${await res.text()}`);
}

export async function strapiUnpublish(path: string, documentId: string): Promise<void> {
  const res = await fetch(
    new URL(`/api/${path}/${documentId}/actions/unpublish`, STRAPI_URL).toString(),
    { method: "POST", headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Strapi unpublish ${res.status}: ${await res.text()}`);
}

export async function strapiGetOne<T>(path: string, documentId: string): Promise<T> {
  const res = await fetch(new URL(`/api/${path}/${documentId}`, STRAPI_URL).toString(), {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T };
  return json.data;
}
