import Link from "next/link";
import { DIFFICULTY_LABELS, difficultySchema } from "@duh/shared";
import type { RouteListResponse, RouteQuery } from "@duh/shared";
import { fetchApi } from "@/lib/api-server";
import { RouteCard, RouteCardSkeleton } from "@/components/RouteCard";

export const revalidate = 60;

interface CatalogProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getSearchParams(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  return await searchParams;
}

export default async function CatalogPage({ searchParams }: CatalogProps) {
  const resolvedSearchParams = await getSearchParams(searchParams);
  const query: RouteQuery = { sort: "newest" };

  const page = Number(resolvedSearchParams.page) || 1;
  query.page = page;

  if (resolvedSearchParams.difficulty && difficultySchema.safeParse(resolvedSearchParams.difficulty).success) {
    query.difficulty = String(resolvedSearchParams.difficulty) as RouteQuery["difficulty"];
  }
  if (typeof resolvedSearchParams.region === "string" && resolvedSearchParams.region) {
    query.region = resolvedSearchParams.region;
  }
  if (typeof resolvedSearchParams.sort === "string") {
    query.sort = resolvedSearchParams.sort as RouteQuery["sort"];
  }

  const params = new URLSearchParams();
  if (query.difficulty) params.set("difficulty", query.difficulty);
  if (query.region) params.set("region", query.region);
  if (query.sort) params.set("sort", query.sort);
  params.set("limit", "12");

  let data: RouteListResponse = { items: [], pagination: { page: 1, limit: 12, total: 0, pages: 1 } };
  try {
    data = await fetchApi<RouteListResponse>(`/routes?page=${page}&${params.toString()}`);
  } catch {
    // пусто
  }

  const { items, pagination } = data;

  const buildQuery = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    return next.toString();
  };

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <h1 className="page-title">Каталог маршрутов</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Найдите идеальный маршрут для вашего следующего мотопутешествия
        </p>
      </header>

      <form className="filters" method="GET" action="/catalog" style={{ marginBottom: 32 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 500, minWidth: 200 }}>
          <span>Регион</span>
          <input
            type="text"
            name="region"
            placeholder="Например: Алтай, Карелия, Крым..."
            defaultValue={query.region ?? ""}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 500, minWidth: 180 }}>
          <span>Сложность</span>
          <select name="difficulty" defaultValue={query.difficulty ?? ""}>
            <option value="">Любая сложность</option>
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 500, minWidth: 180 }}>
          <span>Сортировка</span>
          <select name="sort" defaultValue={query.sort}>
            <option value="newest">Сначала новые</option>
            <option value="popular">Сначала популярные</option>
            <option value="longest">Сначала длинные</option>
          </select>
        </label>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-primary">
            Применить
          </button>
          {params.toString() !== "" && (
            <Link href="/catalog" className="btn btn-secondary">
              Сбросить
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: "1.1rem", marginBottom: 16 }}>
            {params.toString() ? "Пока нет маршрутов по таким фильтрам." : "Каталог пуст — станьте первым!"}
          </p>
          <Link
            href={params.toString() ? "/catalog" : "/dashboard/new"}
            className="btn btn-primary"
          >
            {params.toString() ? "Сбросить фильтры" : "Опубликовать первый маршрут"}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid" role="list" aria-label="Список маршрутов">
            {items.map((route, index) => (
              <RouteCard key={route.id} route={route} priority={index < 3} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <nav className="pagination" aria-label="Навигация по страницам">
              {pagination.page > 1 && (
                <Link
                  href={`/catalog?${buildQuery({ page: String(pagination.page - 1) })}`}
                  className="btn btn-secondary"
                  aria-label={`Страница ${pagination.page - 1}`}
                >
                  ← Назад
                </Link>
              )}
              <span style={{ alignSelf: "center", color: "var(--text-muted)" }} aria-current="page">
                Страница {pagination.page} из {pagination.pages}
              </span>
              {pagination.page < pagination.pages && (
                <Link
                  href={`/catalog?${buildQuery({ page: String(pagination.page + 1) })}`}
                  className="btn btn-secondary"
                  aria-label={`Страница ${pagination.page + 1}`}
                >
                  Вперёд →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Каталог маршрутов",
    description: "Каталог маршрутов мотопутешествий. Находите вдохновение для новых поездок.",
  };
}