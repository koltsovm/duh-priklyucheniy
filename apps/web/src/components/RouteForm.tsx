"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { DIFFICULTY_LABELS, difficultySchema } from "@duh/shared";
import { apiFetch } from "@/lib/api-client";
import type { RouteDto } from "@duh/shared";

const MAX_WAYPOINTS = 50;
const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const routeFormSchema = z.object({
  title: z.string().min(3, "Название должно быть не короче 3 символов"),
  description: z.string().min(10, "Описание должно быть не короче 10 символов"),
  difficulty: difficultySchema,
  region: z.string().optional(),
  distanceKm: z.coerce.number().positive("Дистанция должна быть больше 0").optional().nullable(),
  durationDays: z.coerce.number().positive("Дней в пути должно быть больше 0").optional().nullable(),
  waypoints: z.array(z.object({
    name: z.string().min(1, "Название точки обязательно"),
    note: z.string().optional(),
  })).min(1, "Добавьте хотя бы одну точку маршрута"),
});

type RouteFormData = z.infer<typeof routeFormSchema>;
type WaypointField = { name: string; note?: string };
type FieldErrors = {
  title?: string;
  description?: string;
  difficulty?: string;
  region?: string;
  distanceKm?: string;
  durationDays?: string;
  waypoints?: string[];
};

interface RouteFormProps {
  mode: "create" | "edit";
  route?: RouteDto;
}

function WaypointRow({ index, waypoint, onUpdate, onRemove, canRemove }: {
  index: number;
  waypoint: WaypointField;
  onUpdate: (index: number, field: keyof WaypointField, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  return (
    <div className="waypoint-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
      <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
        <span>Точка {index + 1} *</span>
        <input
          value={waypoint.name}
          onChange={(e) => onUpdate(index, "name", e.target.value)}
          placeholder={`Название точки ${index + 1}`}
          required
          aria-required="true"
          autoComplete="off"
        />
      </label>
      <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
        <span>Комментарий</span>
        <input
          value={waypoint.note ?? ""}
          onChange={(e) => onUpdate(index, "note", e.target.value)}
          placeholder="Комментарий (необязательно)"
          autoComplete="off"
        />
      </label>
      {canRemove && (
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onRemove(index)}
          aria-label={`Удалить точку ${index + 1}`}
          style={{ height: "fit-content", padding: "10px 14px" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function PhotoUpload({ photos, previews, onChange, onRemove, loading }: {
  photos: File[];
  previews: string[];
  onChange: (files: File[]) => void;
  onRemove: (index: number) => void;
  loading: boolean;
}) {
  const inputRef = useState<HTMLInputElement | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        errors.push(`${file.name}: недопустимый формат (только JPEG, PNG, WEBP, GIF)`);
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        errors.push(`${file.name}: файл слишком большой (макс. 5 МБ)`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    const remainingSlots = MAX_PHOTOS - photos.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    onChange([...photos, ...filesToAdd]);

    if (validFiles.length > remainingSlots) {
      alert(`Можно загрузить максимум ${MAX_PHOTOS} фото. Добавлены только первые ${remainingSlots}.`);
    }

    if (e.target) e.target.value = "";
  }, [photos.length, onChange]);

  return (
    <div>
      <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
        <span>Фотографии (до {MAX_PHOTOS})</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          disabled={loading || photos.length >= MAX_PHOTOS}
          aria-describedby="photo-hint"
        />
        <span id="photo-hint" className="hint">
          JPEG, PNG, WEBP или GIF, до 5 МБ каждое. Максимум {MAX_PHOTOS} фото.
        </span>
      </label>

      {previews.length > 0 && (
        <div className="photo-upload-thumbs" role="list" aria-label="Предпросмотр загруженных фото">
          {previews.map((src, i) => (
            <figure key={i} className="photo-thumb" role="listitem" style={{ position: "relative", margin: 0 }}>
              <img src={src} alt={`Предпросмотр фото ${i + 1}`} style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Удалить фото ${i + 1}`}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </figure>
          ))}
        </div>
      )}

      {photos.length >= MAX_PHOTOS && (
        <p className="hint" style={{ color: "var(--accent)" }}>Достигнут лимит в {MAX_PHOTOS} фото</p>
      )}
    </div>
  );
}

export function RouteForm({ mode, route }: RouteFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState<RouteFormData>({
    title: route?.title ?? "",
    description: route?.description ?? "",
    difficulty: route?.difficulty ?? "medium",
    region: route?.region ?? "",
    distanceKm: route?.distanceKm ?? null,
    durationDays: route?.durationDays ?? null,
    waypoints: route?.waypoints.map((w) => ({ name: w.name, note: w.note ?? "" })) ?? [{ name: "", note: "" }],
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof RouteFormData, boolean>>>({});

  const validateField = useCallback((name: keyof RouteFormData, value: unknown) => {
    const fieldSchema = routeFormSchema.shape[name];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);
      setErrors((prev) => ({ ...prev, [name]: result.success ? undefined : result.error.errors[0].message }));
    }
  }, []);

  const validateWaypoints = useCallback((waypoints: WaypointField[]) => {
    const filtered = waypoints.filter((w) => w.name.trim());
    if (filtered.length === 0) {
      setErrors((prev) => ({ ...prev, waypoints: ["Добавьте хотя бы одну точку маршрута"] }));
      return false;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.waypoints;
      return next;
    });
    return true;
  }, []);

  const handleChange = useCallback((name: keyof RouteFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  }, [touched, validateField]);

  const handleBlur = useCallback((name: keyof RouteFormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  }, [formData, validateField]);

  const addWaypoint = useCallback(() => {
    if (formData.waypoints.length >= MAX_WAYPOINTS) return;
    setFormData((prev) => ({ ...prev, waypoints: [...prev.waypoints, { name: "", note: "" }] }));
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, waypoints: prev.waypoints.filter((_, i) => i !== index) }));
  }, []);

  const updateWaypoint = useCallback((index: number, field: keyof WaypointField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      waypoints: prev.waypoints.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    }));
  }, []);

  const handlePhotosChange = useCallback((newPhotos: File[]) => {
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  }, []);

  const removePhoto = useCallback((index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }, [photoPreviews]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<string, boolean>);
    setTouched(allTouched);

    const validation = routeFormSchema.safeParse({
      ...formData,
      waypoints: formData.waypoints.filter((w) => w.name.trim()),
    });

    if (!validation.success) {
      const fieldErrors: FieldErrors = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        if (path === "waypoints") {
          if (!fieldErrors.waypoints) fieldErrors.waypoints = [];
          fieldErrors.waypoints.push(err.message);
        } else {
          const key = path as Exclude<keyof RouteFormData, "waypoints">;
          fieldErrors[key] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!validateWaypoints(formData.waypoints)) return;

    setLoading(true);
    try {
      const body = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        region: formData.region || null,
        distanceKm: formData.distanceKm,
        durationDays: formData.durationDays,
        waypoints: formData.waypoints
          .filter((w) => w.name.trim())
          .map((w) => ({ name: w.name.trim(), note: w.note?.trim() || null })),
      };

      let saved: RouteDto;
      if (isEdit && route) {
        saved = await apiFetch<RouteDto>(`/users/me/routes/${route.id}`, { method: "PATCH", body });
      } else {
        saved = await apiFetch<RouteDto>("/users/me/routes", { method: "POST", body });
      }

      if (photos.length > 0) {
        const formDataUpload = new FormData();
        photos.forEach((file) => formDataUpload.append("photos", file));
        try {
          saved = await apiFetch<RouteDto>(`/users/me/routes/${saved.id}/photos`, {
            method: "POST",
            body: formDataUpload,
            isFormData: true,
          });
        } catch (photoErr) {
          console.warn("Фото не загрузились:", photoErr);
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Не удалось сохранить маршрут");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {submitError && <div className="form-error" role="alert">{submitError}</div>}

      <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
        Название маршрута *
        <input
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          onBlur={() => handleBlur("title")}
          placeholder="Алтай: Чуйский тракт и перевалы"
          required
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : "title-hint"}
          disabled={loading}
        />
        {errors.title && <span id="title-error" className="form-error" style={{ fontSize: "0.85rem", marginTop: 4 }}>{errors.title}</span>}
        <span id="title-hint" className="hint">Например: «Алтай: Чуйский тракт и перевалы»</span>
      </label>

      <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
        Регион
        <input
          value={formData.region}
          onChange={(e) => handleChange("region", e.target.value)}
          onBlur={() => handleBlur("region")}
          placeholder="Алтай, Карелия, Крым..."
          aria-describedby={errors.region ? "region-error" : "region-hint"}
          disabled={loading}
        />
        {errors.region && <span id="region-error" className="form-error" style={{ fontSize: "0.85rem", marginTop: 4 }}>{errors.region}</span>}
        <span id="region-hint" className="hint">Страна/регион для фильтра в каталоге</span>
      </label>

      <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
        Сложность *
        <select
          value={formData.difficulty}
          onChange={(e) => handleChange("difficulty", e.target.value)}
          onBlur={() => handleBlur("difficulty")}
          aria-invalid={!!errors.difficulty}
          aria-describedby={errors.difficulty ? "difficulty-error" : "difficulty-hint"}
          disabled={loading}
        >
          {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.difficulty && <span id="difficulty-error" className="form-error" style={{ fontSize: "0.85rem", marginTop: 4 }}>{errors.difficulty}</span>}
        <span id="difficulty-hint" className="hint">Выберите уровень сложности маршрута</span>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
          Дистанция, км
          <input
            type="number"
            min={1}
            value={formData.distanceKm ?? ""}
            onChange={(e) => handleChange("distanceKm", e.target.value ? Number(e.target.value) : null)}
            onBlur={() => handleBlur("distanceKm")}
            placeholder="1200"
            aria-describedby={errors.distanceKm ? "distance-error" : "distance-hint"}
            disabled={loading}
          />
          {errors.distanceKm && <span id="distance-error" className="form-error" style={{ fontSize: "0.85rem", marginTop: 4 }}>{errors.distanceKm}</span>}
          <span id="distance-hint" className="hint">Общая длина маршрута в километрах</span>
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
          Дней в пути
          <input
            type="number"
            min={1}
            value={formData.durationDays ?? ""}
            onChange={(e) => handleChange("durationDays", e.target.value ? Number(e.target.value) : null)}
            onBlur={() => handleBlur("durationDays")}
            placeholder="7"
            aria-describedby={errors.durationDays ? "duration-error" : "duration-hint"}
            disabled={loading}
          />
          {errors.durationDays && <span id="duration-error" className="form-error" style={{ fontSize: "0.85rem", marginTop: 4 }}>{errors.durationDays}</span>}
          <span id="duration-hint" className="hint">Количество дней поездки</span>
        </label>
      </div>

      <label style={{ display: "grid", gap: 6, fontWeight: 500 }}>
        Описание *
        <textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          onBlur={() => handleBlur("description")}
          placeholder="Чем интересен маршрут, что посмотреть, где ночевать..."
          required
          aria-required="true"
          minLength={10}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : "description-hint"}
          disabled={loading}
          rows={6}
        />
        {errors.description && <span id="description-error" className="form-error" style={{ fontSize: "0.85rem", marginTop: 4 }}>{errors.description}</span>}
        <span id="description-hint" className="hint">Минимум 10 символов. Опишите маршрут, достопримечательности, места ночевки.</span>
      </label>

      <fieldset style={{ border: "none", padding: 0, marginTop: 8 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>Остановки по маршруту *</legend>
        <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
          {formData.waypoints.map((wp, index) => (
            <WaypointRow
              key={index}
              index={index}
              waypoint={wp}
              onUpdate={updateWaypoint}
              onRemove={removeWaypoint}
              canRemove={formData.waypoints.length > 1}
            />
          ))}
        </div>
        {errors.waypoints && (
          <div className="form-error" role="alert" style={{ marginBottom: 10 }}>
            {errors.waypoints[0]}
          </div>
        )}
        <button type="button" className="btn btn-secondary" onClick={addWaypoint} disabled={loading || formData.waypoints.length >= MAX_WAYPOINTS}>
          + Добавить точку
        </button>
        <p className="hint">В будущем здесь будет построение маршрута на карте (Yandex Maps). Максимум {MAX_WAYPOINTS} точек.</p>
      </fieldset>

      <PhotoUpload
        photos={photos}
        previews={photoPreviews}
        onChange={handlePhotosChange}
        onRemove={removePhoto}
        loading={loading}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 200 }}>
          {loading ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Опубликовать маршрут"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.push("/dashboard")} disabled={loading}>
          Отмена
        </button>
      </div>
      <p className="hint">Маршрут публикуется в каталог сразу после сохранения (self-publish).</p>
    </form>
  );
}