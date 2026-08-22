const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export const API_ORIGIN = new URL(API_URL).origin;

/** Универсальный fetch для серверных компонентов/SSR (ISR-friendly). */
export async function fetchApi<T>(
  path: string,
  options: { revalidate?: number; cache?: RequestCache } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: options.cache ?? "force-cache",
    next: options.revalidate !== undefined ? { revalidate: options.revalidate } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Запрос ${path} завершился с ошибкой ${res.status}`);
  }
  return res.json() as Promise<T>;
}