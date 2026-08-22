"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@duh/shared";
import type { AuthResponse } from "@duh/shared";
import { apiFetch, setAccessToken } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 className="page-title">Регистрация</h1>
      <form className="form" onSubmit={onSubmit}>
        {error && <div className="form-error">{error}</div>}
        <label>
          Имя (будет видно другим байкерам)
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Андрей" />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label>
          Пароль
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 8 символов" />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
        </button>
        <p>
          Уже есть аккаунт? <Link href="/auth/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}