"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "duh_access_token";

let accessToken: string | null = null;
if (typeof window !== "undefined") {
  accessToken = window.sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
  else window.sessionStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Клиентский fetch с Bearer-токеном и авто-refresh при 401. */
export async function apiFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown; isFormData?: boolean },
): Promise<T> {
  return request<T>(path, init, false);

  async function request<T2>(
    path: string,
    init?: { method?: string; body?: unknown; isFormData?: boolean },
    isRetry = false,
  ): Promise<T2> {
    const headers: Record<string, string> = {};
    if (!init?.isFormData) headers["Content-Type"] = "application/json";
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const res = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? "GET",
      headers,
      credentials: "include", // для httpOnly refresh-cookie
      body: init?.isFormData
        ? (init.body as FormData)
        : init?.body !== undefined
          ? JSON.stringify(init.body)
          : undefined,
    });

    // Авто-восстановление: 401 → refresh → повтор запроса один раз
    if (res.status === 401 && !isRetry && path !== "/auth/refresh") {
      const refreshed = await request<{ accessToken: string }>("/auth/refresh", {
        method: "POST",
      });
      setAccessToken(refreshed.accessToken);
      return request<T2>(path, init, true);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ?? `Ошибка ${res.status}`);
    }
    if (res.status === 204) return undefined as T2;
    return res.json() as Promise<T2>;
  }
}