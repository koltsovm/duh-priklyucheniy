import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { DIFFICULTY_LABELS } from "@duh/shared";
import type { RouteDto, RoutePhotoDto } from "@duh/shared";
import { fetchApi, API_ORIGIN } from "@/lib/api-server";
import { formatDate, formatDistance, formatDuration } from "@/lib/format";

// ISR: страница пересобирается при попадании в примере TTL
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getRoute(slug: string): Promise<RouteDto | null> {
  try {
    return await fetchApi<RouteDto>(`/routes/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const route = await getRoute(resolvedParams.slug);
  if (!route) return { title: "Маршрут не найден" };
  return {
    title: route.title,
    description: route.description.slice(0, 155),
    openGraph: {
      title: route.title,
      description: route.description.slice(0, 155),
      images: route.photos[0] ? [`${API_ORIGIN}${route.photos[0].url}`] : [],
      type: "article",
    },
  };
}

function getCoverPhoto(photos: RoutePhotoDto[]): RoutePhotoDto | undefined {
  return photos.find((p) => p.isCover) ?? photos[0];
}

export default async function RouteDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const route = await getRoute(resolvedParams.slug);

  if (!route) notFound();

  const cover = getCoverPhoto(route.photos);
  const coverUrl = cover ? `${API_ORIGIN}${cover.url}` : null;
  const galleryPhotos = route.photos.filter((p) => p !== cover);

  return (
    <article className="route-detail">
      <header style={{ marginBottom: 16 }}>
        <h1>{route.title}</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Автор: <strong style={{ color: "var(--text)" }}>{route.author.name}</strong>{" "}
          · опубликовано <time dateTime={route.publishedAt}>{formatDate(route.publishedAt)}</time>
        </p>
      </header>

      <div className="route-stats" style={{ marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <span className={`badge badge-${route.difficulty}`} aria-label={`Сложность: ${DIFFICULTY_LABELS[route.difficulty]}`}>
          Сложность: {DIFFICULTY_LABELS[route.difficulty]}
        </span>
        {route.region && <span>📍 {route.region}</span>}
        {route.distanceKm && <span>🛣 {formatDistance(route.distanceKm)}</span>}
        {route.durationDays && <span>⏱ {formatDuration(route.durationDays)}</span>}
        <span>👁 {route.viewCount.toLocaleString("ru-RU")}</span>
      </div>

      {coverUrl && (
        <figure style={{ marginBottom: 24 }}>
          <img
            src={coverUrl}
            alt={route.title}
            className="route-hero-img"
            style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: "var(--radius)" }}
          />
          {galleryPhotos.length > 0 && (
            <figcaption style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Ещё {galleryPhotos.length} фото в галерее
            </figcaption>
          )}
        </figure>
      )}

      {galleryPhotos.length > 0 && (
        <div className="photo-upload-thumbs" style={{ marginBottom: 32 }} role="list" aria-label="Галерея маршрута">
          {galleryPhotos.map((p) => (
            <img
              key={p.id}
              src={`${API_ORIGIN}${p.url}`}
              alt=""
              style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
              loading="lazy"
              role="listitem"
            />
          ))}
        </div>
      )}

      <div className="route-description" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: 32 }}>
        {route.description}
      </div>

      {route.waypoints.length > 0 && (
        <section className="waypoints" aria-labelledby="waypoints-heading">
          <h2 id="waypoints-heading" style={{ fontSize: "1.2rem", marginBottom: 12 }}>Остановки по маршруту</h2>
          <ol style={{ paddingLeft: 20, display: "grid", gap: 12 }}>
            {route.waypoints.map((wp) => (
              <li key={wp.id} style={{ lineHeight: 1.6 }}>
                <strong>{wp.name}</strong>
                {wp.note && (
                  <div className="note" style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: 4 }}>
                    {wp.note}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <nav style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap" }} aria-label="Действия с маршрутом">
        <Link href="/catalog" className="btn btn-secondary">
          ← Назад в каталог
        </Link>
      </nav>
    </article>
  );
}