"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RouteDto } from "@duh/shared";
import { apiFetch, setAccessToken } from "@/lib/api-client";
import { RouteCard } from "@/components/RouteCard";

export default function DashboardPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<RouteDto[] | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const me = await apiFetch<{ user: { name: string } }>("/auth/me");
      setUserName(me.user.name);
      const myRoutes = await apiFetch<RouteDto[]>("/users/me/routes");
      setRoutes(myRoutes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить данные");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    if (!window.confirm("Удалить маршрут? Это действие необратимо.")) return;
    try {
      await apiFetch<void>(`/users/me/routes/${id}`, { method: "DELETE" });
      setRoutes((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить маршрут");
    }
  }

  async function onLogout() {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } catch {
      // всё равно выходим локально
    }
    setAccessToken(null);
    router.push("/");
  }

  if (error) {
    return (
      <div>
        <h1 className="page-title">Личный кабинет</h1>
        <div className="form-error">{error}</div>
        <p style={{ marginTop: 16 }}>
          <Link href="/auth/login" className="btn btn-primary">
            Войти
          </Link>
        </p>
      </div>
    );
  }

  if (!routes) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            Личный кабинет
          </h1>
          <p style={{ color: "var(--text-muted)" }}>Привет, {userName || "байкер"}!</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard/new" className="btn btn-primary">
            + Новый маршрут
          </Link>
          <button type="button" className="btn btn-secondary" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="empty-state">
          <p>У вас пока нет маршрутов.</p>
          <Link href="/dashboard/new" className="btn btn-primary">
            Опубликовать первый маршрут
          </Link>
        </div>
      ) : (
        <>
          <div className="grid">
            {routes.map((route) => (
              <div key={route.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <RouteCard route={route} />
                <div style={{ display: "flex", gap: 8, padding: "0 4px" }}>
                  <Link href={`/dashboard/routes/${route.id}/edit`} className="btn btn-secondary" style={{ flex: 1 }}>
                    Редактировать
                  </Link>
                  <button type="button" className="btn btn-danger" onClick={() => onDelete(route.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 16 }}>
            Ваши маршруты публикуются в каталог сразу после сохранения.
          </p>
        </>
      )}
    </div>
  );
}