"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@duh/shared";
import type { AuthResponse } from "@duh/shared";
import { apiFetch, setAccessToken } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: parsed.data,
      });
      setAccessToken(data.accessToken);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <header style={{ marginBottom: 24, textAlign: "center" }}>
        <h1 className="page-title">Вход в аккаунт</h1>
        <p style={{ color: "var(--text-muted)" }}>Войдите, чтобы управлять своими маршрутами</p>
      </header>

      <form className="form" onSubmit={onSubmit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}

        <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={loading}
            aria-describedby={error ? "login-error" : undefined}
          />
        </label>

        <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading}
            aria-describedby={error ? "login-error" : undefined}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Входим..." : "Войти"}
        </button>

        <p style={{ textAlign: "center", marginTop: 16, color: "var(--text-muted)" }}>
          Нет аккаунта? <Link href={`/auth/register?next=${encodeURIComponent(redirectTo)}`}>Зарегистрируйтесь</Link>
        </p>
      </form>
    </div>
  );
}