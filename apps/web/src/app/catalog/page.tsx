import Link from "next/link";
import { DIFFICULTY_LABELS, difficultySchema } from "@duh/shared";
import type { RouteListResponse, RouteQuery } from "@duh/shared";
import { fetchApi } from "@/lib/api-server";
import { RouteCard } from "@/components/RouteCard";

export const revalidate = 60;

interface CatalogProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function CatalogPage({ searchParams }: CatalogProps) {
  const query: RouteQuery = { sort: "newest" };

  const page = Number(searchParams.page) || 1;
  query.page = page;

  if (searchParams.difficulty && difficultySchema.safeParse(searchParams.difficulty).success) {
    query.difficulty = String(searchParams.difficulty) as RouteQuery["difficulty"];
  }
  if (typeof searchParams.region === "string" && searchParams.region) {
    query.region = searchParams.region;
  }
  if (typeof searchParams.sort === "string") {
    query.sort = searchParams.sort as RouteQuery["sort"];
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
      <h1 className="page-title">Каталог маршрутов</h1>

      <form className="filters" method="GET" action="/catalog">
        <label>
          <input
            type="text"
            name="region"
            placeholder="Регион, например «Алтай»"
            defaultValue={query.region ?? ""}
          />
        </label>
        <label>
          <select name="difficulty" defaultValue={query.difficulty ?? ""}>
            <option value="">Любая сложность</option>
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <select name="sort" defaultValue={query.sort}>
            <option value="newest">Сначала новые</option>
            <option value="popular">Сначала популярные</option>
            <option value="longest">Сначала длинные</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          Применить
        </button>
        {params.toString() !== "" && (
          <Link href="/catalog" className="btn btn-secondary">
            Сбросить
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Пока нет маршрутов по таким фильтрам.</p>
          <Link href="/dashboard/new" className="btn btn-primary">
            Опубликовать первый маршрут
          </Link>
        </div>
      ) : (
        <>
          <div className="grid">
            {items.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              {pagination.page > 1 && (
                <Link
                  href={`/catalog?${buildQuery({ page: String(pagination.page - 1) })}`}
                  className="btn btn-secondary"
                >
                  ← Назад
                </Link>
              )}
              <span style={{ alignSelf: "center", color: "var(--text-muted)" }}>
                Страница {pagination.page} из {pagination.pages}
              </span>
              {pagination.page < pagination.pages && (
                <Link
                  href={`/catalog?${buildQuery({ page: String(pagination.page + 1) })}`}
                  className="btn btn-secondary"
                >
                  Вперёд →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}