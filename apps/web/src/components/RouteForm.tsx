"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTY_LABELS, difficultySchema } from "@duh/shared";
import { apiFetch } from "@/lib/api-client";
import type { RouteDto } from "@duh/shared";

type WaypointField = { name: string; note: string };

interface RouteFormProps {
  mode: "create" | "edit";
  route?: RouteDto; // для edit
}

export function RouteForm({ mode, route }: RouteFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(route?.title ?? "");
  const [description, setDescription] = useState(route?.description ?? "");
  const [difficulty, setDifficulty] = useState<string>(route?.difficulty ?? "medium");
  const [region, setRegion] = useState(route?.region ?? "");
  const [distanceKm, setDistanceKm] = useState(
    route?.distanceKm != null ? String(route.distanceKm) : "",
  );
  const [durationDays, setDurationDays] = useState(
    route?.durationDays != null ? String(route.durationDays) : "",
  );
  const [waypoints, setWaypoints] = useState<WaypointField[]>(
    route?.waypoints.map((w) => ({ name: w.name, note: w.note ?? "" })) ?? [{ name: "", note: "" }],
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addWaypoint() {
    if (waypoints.length >= 50) return;
    setWaypoints((prev) => [...prev, { name: "", note: "" }]);
  }
  function removeWaypoint(index: number) {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  }
  function updateWaypoint(index: number, field: keyof WaypointField, value: string) {
    setWaypoints((prev) => prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)));
  }

  function onPhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setPhotos(files);
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const difficultyParsed = difficultySchema.safeParse(difficulty);
    if (!difficultyParsed.success) {
      setError("Некорректная сложность");
      return;
    }

    const body = {
      title,
      description,
      difficulty: difficultyParsed.data,
      region: region || null,
      distanceKm: distanceKm ? Number(distanceKm) : null,
      durationDays: durationDays ? Number(durationDays) : null,
      waypoints: waypoints
        .filter((w) => w.name.trim())
        .map((w) => ({ name: w.name.trim(), note: w.note.trim() || null })),
    };

    setLoading(true);
    try {
      let saved: RouteDto;
      if (isEdit && route) {
        saved = await apiFetch<RouteDto>(`/users/me/routes/${route.id}`, { method: "PATCH", body });
      } else {
        saved = await apiFetch<RouteDto>("/users/me/routes", { method: "POST", body });
      }

      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((file) => formData.append("photos", file));
        try {
          saved = await apiFetch<RouteDto>(`/users/me/routes/${saved.id}/photos`, {
            method: "POST",
            body: formData,
            isFormData: true,
          });
        } catch (photoErr) {
          console.warn("Фото не загрузились:", photoErr);
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить маршрут");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {error && <div className="form-error">{error}</div>}

      <label>
        Название маршрута
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Алтай: Чуйский тракт и перевалы" required minLength={3} />
      </label>

      <label>
        Регион
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Алтай, Карелия, Крым..." />
        <span className="hint">Страна/регион для фильтра в каталоге</span>
      </label>

      <label>
        Сложность
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <label>
          Дистанция, км
          <input type="number" min={1} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="1200" />
        </label>
        <label>
          Дней в пути
          <input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="7" />
        </label>
      </div>

      <label>
        Описание
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Чем интересен маршрут, что посмотреть, где ночевать..." required minLength={10} />
      </label>

      <fieldset style={{ border: "none", padding: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>Остановки по маршруту</legend>
        <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
          {waypoints.map((wp, index) => (
            <div className="waypoint-row" key={index}>
              <input
                value={wp.name}
                onChange={(e) => updateWaypoint(index, "name", e.target.value)}
                placeholder={`Точка ${index + 1} (название)`}
              />
              <input
                value={wp.note}
                onChange={(e) => updateWaypoint(index, "note", e.target.value)}
                placeholder="Комментарий (необязательно)"
              />
              {waypoints.length > 1 && (
                <button type="button" className="btn btn-danger" onClick={() => removeWaypoint(index)}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary" onClick={addWaypoint}>
          + Добавить точку
        </button>
        <p className="hint">В будущем здесь будет построение маршрута на карте (Yandex Maps).</p>
      </fieldset>

      <label>
        Фотографии (до 5)
        <input type="file" accept="image/*" multiple onChange={onPhotosChange} />
        <span className="hint">JPEG, PNG, WEBP или GIF, до 5 МБ каждая</span>
      </label>
      {photoPreviews.length > 0 && (
        <div className="photo-upload-thumbs">
          {photoPreviews.map((src, i) => (
            <img key={i} src={src} alt="" />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Опубликовать маршрут"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.push("/dashboard")}>
          Отмена
        </button>
      </div>
      <p className="hint">Маршрут публикуется в каталог сразу после сохранения (self-publish).</p>
    </form>
  );
}
