/**
 * Safe fetch utility for CodeMtaani Group administrative and client panels.
 * Prevents "Unexpected token '<', '<!DOCTYPE "... is not valid JSON" errors
 * by validating content-type headers, handling HTTP redirects, and returning structured errors.
 */
export type SafeFetchResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export async function safeFetchJson<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options?.headers || {}),
      },
    });

    // Session expired / unauthenticated: redirect to login
    if (res.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
      return {
        ok: false,
        status: 401,
        data: null,
        error: "Session expired. Redirecting to login...",
      };
    }

    const contentType = res.headers.get("content-type") || "";

    // Verify response is actually JSON before parsing
    if (!contentType.toLowerCase().includes("application/json")) {
      const text = await res.text();
      const snippet = text.slice(0, 100).replace(/\s+/g, " ");
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Server returned non-JSON response (${res.status}): ${snippet}`,
      };
    }

    const data = (await res.json()) as T;

    if (!res.ok) {
      const errObj = data as { error?: string; message?: string };
      return {
        ok: false,
        status: res.status,
        data: null,
        error: errObj.error || errObj.message || `Request failed with status ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network request failed.";
    return {
      ok: false,
      status: 0,
      data: null,
      error: message,
    };
  }
}
