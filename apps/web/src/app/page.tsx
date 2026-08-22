import Link from "next/link";
import { fetchApi } from "@/lib/api-server";
import { RouteCard } from "@/components/RouteCard";
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

  return (
    <div>
      <section className="hero">
        <h1>
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
        <section>
          <h2 className="page-title">Свежие маршруты</h2>
          <div className="grid">
            {latest.items.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/catalog" className="btn btn-secondary">
              Весь каталог →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}