const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class HttpError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let _jwtToken: string | null = null;

export function setJwtToken(token: string | null) {
  _jwtToken = token;
}

function resolveToken(token: string | null | undefined): string | null {
  const t = token ?? _jwtToken;
  return t != null && t !== "session" ? t : null;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const activeToken = resolveToken(token);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers ?? {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(activeToken ? { "Authorization": `Bearer ${activeToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new HttpError(payload?.message ?? "Error de comunicacion", response.status, payload?.fieldErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
