"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RouteDto } from "@duh/shared";
import { apiFetch } from "@/lib/api-client";
import { RouteForm } from "@/components/RouteForm";
import { API_ORIGIN } from "@/lib/api-server";

export default function EditRoutePage() {
  const params = useParams<{ id: string }>();
  const [route, setRoute] = useState<RouteDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<RouteDto>(`/users/me/routes/${params.id}`)
      .then(setRoute)
      .catch((err) => setError(err instanceof Error ? err.message : "Маршрут не найден"));
  }, [params.id]);

  if (error) {
    return (
      <div>
        <h1 className="page-title">Редактирование</h1>
        <div className="form-error">{error}</div>
        <p style={{ marginTop: 16 }}>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Назад
          </Link>
        </p>
      </div>
    );
  }

  if (!route) {
    return <div className="loading">Загрузка маршрута...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Редактирование: {route.title}</h1>

      {route.photos.length > 0 && (
        <div className="photo-upload-thumbs" style={{ marginBottom: 20 }}>
          {route.photos.map((p) => (
            <img key={p.id} src={`${API_ORIGIN}${p.url}`} alt="" />
          ))}
        </div>
      )}

      <RouteForm mode="edit" route={route} />
    </div>
  );
}