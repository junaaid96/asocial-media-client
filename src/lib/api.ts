export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

const TOKEN_KEY = "asocial.token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Private browsing: the session just won't persist.
    }
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Fired when the API rejects our token so the app can sign out gracefully. */
export const SESSION_EXPIRED = "asocial:session-expired";

export async function api<T>(path: string, init: { method?: string; body?: unknown; raw?: Blob; query?: Record<string, string | undefined> } = {}): Promise<T> {
  const url = new URL(`${API_URL}/api${path}`);
  for (const [key, value] of Object.entries(init.query ?? {})) if (value) url.searchParams.set(key, value);

  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.raw) headers["content-type"] = init.raw.type || "application/octet-stream";

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? "GET",
      headers,
      body: init.raw ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
    });
  } catch {
    throw new ApiError(0, "We couldn't reach aSocial. Check your connection and try again.");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event(SESSION_EXPIRED));
    throw new ApiError(res.status, data.error ?? "Something went wrong");
  }
  return data as T;
}

/** API file paths are relative (/api/files/...); resolve them against the API host. */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return /^https?:/.test(path) ? path : `${API_URL}${path}`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
