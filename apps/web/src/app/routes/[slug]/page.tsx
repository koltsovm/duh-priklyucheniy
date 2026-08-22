import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DIFFICULTY_LABELS } from "@duh/shared";
import type { RouteDto } from "@duh/shared";
import { fetchApi, API_ORIGIN } from "@/lib/api-server";
import { formatDate, formatDistance, formatDuration } from "@/lib/format";

// ISR: страница пересобирается при попадании в примере TTL
export const revalidate = 60;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const route = await fetchApi<RouteDto>(`/routes/${params.slug}`);
    return {
      title: route.title,
      description: route.description.slice(0, 155),
    };
  } catch {
    return { title: "Маршрут не найден" };
  }
}

export default async function RouteDetailPage({ params }: Props) {
  let route: RouteDto;
  try {
    route = await fetchApi<RouteDto>(`/routes/${params.slug}`);
  } catch {
    notFound();
    return;
  }

  const cover = route.photos.length > 0 ? `${API_ORIGIN}${route.photos[0].url}` : null;

  return (
    <article className="route-detail">
      <h1>{route.title}</h1>
      <p style={{ color: "var(--text-muted)" }}>
        Автор: <strong style={{ color: "var(--text)" }}>{route.author.name}</strong>{" "}
        · опубликовано {formatDate(route.publishedAt)}
      </p>

      <div className="route-stats">
        <span className={`badge badge-${route.difficulty}`}>
          Сложность: {DIFFICULTY_LABELS[route.difficulty]}
        </span>
        {route.region && <span>📍 {route.region}</span>}
        {route.distanceKm && <span>🛣 {formatDistance(route.distanceKm)}</span>}
        {route.durationDays && <span>⏱ {formatDuration(route.durationDays)}</span>}
        <span>👁 {route.viewCount}</span>
      </div>

      {cover && <img src={cover} alt={route.title} className="route-hero-img" />}

      {route.photos.length > 1 && (
        <div className="photo-upload-thumbs" style={{ marginBottom: 24 }}>
          {route.photos.slice(1).map((p) => (
            <img key={p.id} src={`${API_ORIGIN}${p.url}`} alt="" style={{ width: 120, height: 120 }} />
          ))}
        </div>
      )}

      <div className="route-description">{route.description}</div>

      {route.waypoints.length > 0 && (
        <div className="waypoints">
          <h2>Остановки по маршруту</h2>
          <ol>
            {route.waypoints.map((wp) => (
              <li key={wp.id}>
                <strong>{wp.name}</strong>
                {wp.note && <div className="note">{wp.note}</div>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}