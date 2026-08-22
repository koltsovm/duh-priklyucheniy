import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/errors";
import { slugify } from "../../lib/slugify";
import type { RouteCreateInput, RouteUpdateInput, RouteQueryParsed } from "@duh/shared";

const ROUTE_INCLUDE = {
  author: { select: { id: true, name: true } },
  waypoints: { orderBy: { order: "asc" as const } },
  photos: { orderBy: { order: "asc" as const } },
};

type RouteWithRelations = Prisma.RouteGetPayload<{ include: typeof ROUTE_INCLUDE }>;

export function toRouteDto(route: RouteWithRelations) {
  return {
    id: route.id,
    slug: route.slug,
    title: route.title,
    description: route.description,
    difficulty: route.difficulty.toLowerCase(),
    region: route.region,
    distanceKm: route.distanceKm,
    durationDays: route.durationDays,
    viewCount: route.viewCount,
    publishedAt: route.publishedAt.toISOString(),
    createdAt: route.createdAt.toISOString(),
    updatedAt: route.updatedAt.toISOString(),
    author: route.author,
    waypoints: route.waypoints.map((w) => ({
      id: w.id,
      order: w.order,
      name: w.name,
      lat: w.lat,
      lng: w.lng,
      note: w.note,
    })),
    photos: route.photos.map((p) => ({ id: p.id, url: p.url, order: p.order })),
  };
}

/** Уникальный slug: "altai-2024", "altai-2024-2", ... */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 2;
  while (await prisma.route.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

/* ---------- Публичный каталог ---------- */

export async function listPublished(query: RouteQueryParsed) {
  const where: Prisma.RouteWhereInput = {
    status: "PUBLISHED",
    ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    ...(query.region ? { region: query.region } : {}),
  };

  const orderBy: Prisma.RouteOrderByWithRelationInput =
    query.sort === "popular"
      ? { viewCount: "desc" }
      : query.sort === "longest"
        ? { distanceKm: "desc" }
        : { publishedAt: "desc" };

  const [items, total] = await prisma.$transaction([
    prisma.route.findMany({
      where,
      include: ROUTE_INCLUDE,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.route.count({ where }),
  ]);

  return {
    items: items.map(toRouteDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

const routeNotFound = new ApiError(404, "Маршрут не найден");

export async function getBySlug(slug: string) {
  const route = await prisma.route.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: ROUTE_INCLUDE,
  });
  if (!route) throw routeNotFound;

  // Счётчик просмотров — асинхронно, не блокируем ответ при ошибке
  prisma.route
    .update({ where: { id: route.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return toRouteDto(route);
}

/* ---------- Личный кабинет ---------- */

export async function listMine(authorId: string) {
  const routes = await prisma.route.findMany({
    where: { authorId },
    include: ROUTE_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
  return routes.map(toRouteDto);
}

export async function getMine(authorId: string, id: string) {
  const route = await prisma.route.findFirst({
    where: { id, authorId },
    include: ROUTE_INCLUDE,
  });
  if (!route) throw new ApiError(404, "Маршрут не найден");
  return toRouteDto(route);
}

const ROUTE_DATA_SELECT = {
  title: true,
  description: true,
  difficulty: true,
  region: true,
  distanceKm: true,
  durationDays: true,
} as const;

type RouteData = Prisma.RouteGetPayload<{ select: typeof ROUTE_DATA_SELECT }>;

function routeDataPayload(input: RouteCreateInput | RouteUpdateInput): RouteData {
  return {
    title: input.title ?? "",
    description: input.description ?? "",
    difficulty: input.difficulty ?? "medium",
    region: input.region ?? null,
    distanceKm: input.distanceKm ?? null,
    durationDays: input.durationDays ?? null,
  };
}
export async function createMine(authorId: string, input: RouteCreateInput) {
  const slug = await uniqueSlug(input.title);
  const route = await prisma.route.create({
    data: {
      ...routeDataPayload(input),
      slug,
      authorId,
      waypoints: {
        create: (input.waypoints ?? []).map((w, i) => ({
          order: i,
          name: w.name,
          lat: w.lat ?? null,
          lng: w.lng ?? null,
          note: w.note ?? null,
        })),
      },
    },
    include: ROUTE_INCLUDE,
  });
  return toRouteDto(route);
}

export async function updateMine(authorId: string, id: string, input: RouteUpdateInput) {
  const existing = await prisma.route.findFirst({ where: { id, authorId } });
  if (!existing) throw routeNotFound;

  const data: Prisma.RouteUpdateInput = routeDataPayload(input);

  if (input.waypoints !== undefined) {
    data.waypoints = {
      deleteMany: {},
      create: input.waypoints.map((w, i) => ({
        order: i,
        name: w.name,
        lat: w.lat ?? null,
        lng: w.lng ?? null,
        note: w.note ?? null,
      })),
    };
  }

  const route = await prisma.route.update({
    where: { id },
    data,
    include: ROUTE_INCLUDE,
  });
  return toRouteDto(route);
}

export async function deleteMine(authorId: string, id: string) {
  const existing = await prisma.route.findFirst({ where: { id, authorId } });
  if (!existing) throw routeNotFound;
  await prisma.route.delete({ where: { id } });
}

/* ---------- Фото ---------- */

/** Добавляет фото (url вида /uploads/<routeId>/<file>). */
export async function addPhotos(authorId: string, routeId: string, files: Express.Multer.File[]) {
  const route = await prisma.route.findFirst({ where: { id: routeId, authorId } });
  if (!route) throw routeNotFound;

  const nextOrder = await prisma.routePhoto.aggregate({
    where: { routeId },
    _max: { order: true },
  });

  let order = (nextOrder._max.order ?? -1) + 1;
  await prisma.routePhoto.createMany({
    data: files.map((f) => ({
      routeId,
      url: `/uploads/${routeId}/${f.filename}`,
      order: order++,
    })),
  });

  const updated = await prisma.route.findUnique({
    where: { id: routeId },
    include: ROUTE_INCLUDE,
  });
  if (!updated) throw routeNotFound;
  return toRouteDto(updated);
}
