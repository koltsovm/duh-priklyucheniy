"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@duh/shared";
import type { AuthResponse } from "@duh/shared";
import { apiFetch, setAccessToken } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: parsed.data,
      });
      setAccessToken(data.accessToken);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <header style={{ marginBottom: 24, textAlign: "center" }}>
        <h1 className="page-title">Создать аккаунт</h1>
        <p style={{ color: "var(--text-muted)" }}>Присоединяйтесь к сообществу мотопутешественников</p>
      </header>

      <form className="form" onSubmit={onSubmit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}

        <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
          Имя (будет видно другим байкерам)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Андрей"
            required
            autoComplete="name"
            minLength={2}
            maxLength={80}
            disabled={loading}
            aria-describedby="name-hint"
          />
          <span id="name-hint" className="hint">Минимум 2 символа, максимум 80</span>
        </label>

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
          />
        </label>

        <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 8 символов"
            required
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            disabled={loading}
            aria-describedby="password-hint"
          />
          <span id="password-hint" className="hint">От 8 до 72 символов</span>
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
        </button>

        <p style={{ textAlign: "center", marginTop: 16, color: "var(--text-muted)" }}>
          Уже есть аккаунт? <Link href={`/auth/login?next=${encodeURIComponent(redirectTo)}`}>Войти</Link>
        </p>
      </form>
    </div>
  );
}