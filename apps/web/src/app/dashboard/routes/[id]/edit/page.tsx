"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { RouteDto, RoutePhotoDto } from "@duh/shared";
import { apiFetch } from "@/lib/api-client";
import { RouteForm } from "@/components/RouteForm";
import { API_ORIGIN } from "@/lib/api-server";

export default function EditRoutePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [route, setRoute] = useState<RouteDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch<RouteDto>(`/users/me/routes/${params.id}`)
      .then((data) => {
        if (mounted) setRoute(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Маршрут не найден");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [params.id]);

  if (error) {
    return (
      <div>
        <h1 className="page-title">Редактирование</h1>
        <div className="form-error" role="alert">{error}</div>
        <p style={{ marginTop: 16 }}>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Назад в личный кабинет
          </Link>
        </p>
      </div>
    );
  }

  if (loading || !route) {
    return (
      <div role="status" aria-live="polite" className="loading">
        <div style={{ display: "grid", gap: 16 }}>
          <div className="skeleton skeleton--text" style={{ width: "30%", height: "2rem" }} />
          <div className="skeleton skeleton--text" style={{ width: "50%", height: "1rem" }} />
        </div>
        <p style={{ color: "var(--text-muted)", marginTop: 16 }}>Загрузка маршрута...</p>
      </div>
    );
  }

  const getCoverPhoto = (photos: RoutePhotoDto[]): RoutePhotoDto | undefined => {
    return photos.find((p) => p.isCover) ?? photos[0];
  };

  const cover = getCoverPhoto(route.photos);
  const galleryPhotos = route.photos.filter((p) => p !== cover);

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Редактирование: {route.title}</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Изменения применятся сразу после сохранения
        </p>
      </header>

      {(cover || galleryPhotos.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          {cover && (
            <figure style={{ marginBottom: 12 }}>
              <img
                src={`${API_ORIGIN}${cover.url}`}
                alt={route.title}
                style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: "var(--radius)" }}
              />
              <figcaption style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                Обложка маршрута
              </figcaption>
            </figure>
          )}
          {galleryPhotos.length > 0 && (
            <div className="photo-upload-thumbs" role="list" aria-label="Дополнительные фото">
              {galleryPhotos.map((p) => (
                <img
                  key={p.id}
                  src={`${API_ORIGIN}${p.url}`}
                  alt=""
                  style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                  role="listitem"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <RouteForm mode="edit" route={route} />
    </div>
  );
}