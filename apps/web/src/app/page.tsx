import Link from "next/link";
import { fetchApi } from "@/lib/api-server";
import { RouteCard, RouteCardSkeleton } from "@/components/RouteCard";
import type { RouteListResponse } from "@duh/shared";

// Главная — статическая с revalidate (новые маршруты появятся в течение 60с)
export const revalidate = 60;

export default async function HomePage() {
  let latest: RouteListResponse = { items: [], pagination: { page: 1, limit: 3, total: 0, pages: 1 } };
  try {
    latest = await fetchApi<RouteListResponse>("/routes?page=1&limit=3&sort=newest");
  } catch {
    // API ещё поднимается — показываем заголовок без маршрутов
  }

  const showSkeletons = latest.items.length === 0;

  return (
    <div>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">
          Найди свой <span>Дух приключений</span>
        </h1>
        <p>
          Каталог лучших маршрутов мотопутешествий. Планируйте поездки по готовым трекам,
          вдохновляйтесь историями байкеров и делитесь собственными маршрутами с сообществом.
        </p>
        <div className="hero-actions">
          <Link href="/catalog" className="btn btn-primary">
            Смотреть маршруты
          </Link>
          <Link href="/dashboard/new" className="btn btn-secondary">
            Опубликовать свой маршрут
          </Link>
        </div>
      </section>

      {latest.items.length > 0 && (
        <section aria-labelledby="latest-title">
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <h2 id="latest-title" className="page-title" style={{ marginBottom: 0 }}>Свежие маршруты</h2>
            <Link href="/catalog" className="btn btn-secondary">
              Весь каталог →
            </Link>
          </header>
          <div className="grid" role="list" aria-label="Свежие маршруты">
            {latest.items.map((route, index) => (
              <RouteCard key={route.id} route={route} priority={index < 3} />
            ))}
          </div>
        </section>
      )}

      {showSkeletons && (
        <section aria-labelledby="latest-title" aria-busy="true">
          <h2 id="latest-title" className="page-title" style={{ marginBottom: 24 }}>Свежие маршруты</h2>
          <div className="grid" role="list" aria-label="Загрузка маршрутов">
            {[1, 2, 3].map((i) => <RouteCardSkeleton key={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}