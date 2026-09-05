import { z } from "zod";

/* =========================================================
 * «Дух приключений» — общий контракт API (packages/shared)
 * Единый источник правды: типы, DTO и zod-схемы валидации
 * для web (Next.js) и api (Express).
 * ========================================================= */

/* ---------- Сложность маршрута ---------- */
export const difficultySchema = z.enum(["easy", "medium", "hard", "extreme"], {
  errorMap: () => ({ message: "Недопустимое значение сложности" }),
});
export type Difficulty = z.infer<typeof difficultySchema>;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
  extreme: "Экстрим",
};

/* ---------- Аутентификация ---------- */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z
    .string()
    .min(8, "Пароль должен быть не короче 8 символов")
    .max(72, "Пароль слишком длинный"),
  name: z.string().trim().min(2, "Имя — минимум 2 символа").max(80, "Имя слишком длинное"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type UserDto = z.infer<typeof userDtoSchema>;

export const authResponseSchema = z.object({
  user: userDtoSchema,
  accessToken: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

/* ---------- Маршруты ---------- */
export const waypointInputSchema = z.object({
  name: z.string().trim().min(1, "Укажите название точки").max(120, "Название слишком длинное"),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  note: z.string().trim().max(500, "Примечание слишком длинное").optional().nullable(),
});
export type WaypointInput = z.infer<typeof waypointInputSchema>;

const routeFields = {
  title: z.string().trim().min(3, "Название — минимум 3 символа").max(120, "Название слишком длинное"),
  description: z
    .string()
    .trim()
    .min(10, "Опишите маршрут подробнее (минимум 10 символов)")
    .max(5000, "Описание слишком длинное"),
  difficulty: difficultySchema,
  region: z.string().trim().max(120, "Регион слишком длинный").optional().nullable(),
  distanceKm: z.coerce.number().positive().max(100_000).optional().nullable(),
  durationDays: z.coerce.number().int().positive().max(3650).optional().nullable(),
  waypoints: z.array(waypointInputSchema).max(50, "Слишком много точек").optional(),
};

export const routeCreateSchema = z.object(routeFields);
export type RouteCreateInput = z.infer<typeof routeCreateSchema>;

export const routeUpdateSchema = z.object(routeFields).partial();
export type RouteUpdateInput = z.infer<typeof routeUpdateSchema>;

export const routeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  difficulty: difficultySchema.optional(),
  region: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "popular", "longest"]).default("newest"),
});
export type RouteQuery = z.input<typeof routeQuerySchema>;
export type RouteQueryParsed = z.infer<typeof routeQuerySchema>;
export type RouteSort = RouteQueryParsed["sort"];

/* ---------- DTO маршрута ---------- */
export const waypointDtoSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  name: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  note: z.string().nullable(),
});
export type WaypointDto = z.infer<typeof waypointDtoSchema>;

export const routePhotoDtoSchema = z.object({
  id: z.string(),
  url: z.string(),
  order: z.number().int(),
  isCover: z.boolean().optional(),
});
export type RoutePhotoDto = z.infer<typeof routePhotoDtoSchema>;

export const routeDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: difficultySchema,
  region: z.string().nullable(),
  distanceKm: z.number().nullable(),
  durationDays: z.number().int().nullable(),
  viewCount: z.number().int(),
  publishedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: z.object({ id: z.string(), name: z.string() }),
  waypoints: z.array(waypointDtoSchema).default([]),
  photos: z.array(routePhotoDtoSchema).default([]),
});
export type RouteDto = z.infer<typeof routeDtoSchema>;

export const routeListResponseSchema = z.object({
  items: z.array(routeDtoSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
});
export type RouteListResponse = z.infer<typeof routeListResponseSchema>;

export const userRoutesListResponseSchema = z.array(routeDtoSchema);
export type UserRoutesListResponse = z.infer<typeof userRoutesListResponseSchema>;

/* ---------- Точки (waypoints) — почва для карт ---------- */
/* Уже сейчас храним lat/lng (опционально), чтобы позже
 * интеграция Yandex Maps легла на готовую модель данных. */