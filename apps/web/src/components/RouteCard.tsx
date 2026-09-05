import Link from "next/link";
import { DIFFICULTY_LABELS } from "@duh/shared";
import type { RouteDto, RoutePhotoDto } from "@duh/shared";
import { formatDate, formatDuration } from "@/lib/format";
import { API_ORIGIN } from "@/lib/api-server";

interface RouteCardProps {
  route: RouteDto;
  variant?: "default" | "compact";
  priority?: boolean;
}

function formatDistance(km: number): string {
  return `${km.toLocaleString("ru-RU")} км`;
}

function getCoverImage(photos: RoutePhotoDto[]): RoutePhotoDto | undefined {
  return photos.find((p) => p.isCover) ?? photos[0];
}

export function RouteCard({ route, variant = "default", priority = false }: RouteCardProps) {
  const cover = getCoverImage(route.photos);
  const badge = `badge-${route.difficulty}`;
  const stats = [
    route.region ? `📍 ${route.region}` : null,
    route.distanceKm ? `🛣 ${formatDistance(route.distanceKm)}` : null,
    route.durationDays ? `⏱ ${formatDuration(route.durationDays)}` : null,
    `👁 ${route.viewCount.toLocaleString("ru-RU")}`,
  ]
    .filter(Boolean)
    .join(" · ");

  if (variant === "compact") {
    return (
      <Link href={`/routes/${route.slug}`} className="route-card route-card--compact" aria-label={`${route.title}, ${DIFFICULTY_LABELS[route.difficulty]}`}>
        <div className="thumb" aria-hidden="true">
          {cover ? <img src={`${API_ORIGIN}${cover.url}`} alt="" loading={priority ? "eager" : "lazy"} /> : "🏍"}
        </div>
        <div className="body">
          <h3>{route.title}</h3>
          <p className="meta">{stats}</p>
        </div>
      </Link>
    );
  }

  return (
    <article className="route-card">
      <Link href={`/routes/${route.slug}`} className="route-card__link" aria-label={`Посмотреть маршрут «${route.title}»`}>
        <div className="thumb" aria-hidden="true">
          {cover ? (
            <img
              src={`${API_ORIGIN}${cover.url}`}
              alt=""
              loading={priority ? "eager" : "lazy"}
              width={400}
              height={225}
            />
          ) : (
            <span aria-hidden="true" role="img">🏍</span>
          )}
        </div>
        <div className="body">
          <h3>{route.title}</h3>
          <p className="meta">{stats}</p>
          <p className="meta" style={{ marginTop: 6 }}>
            <span className={`badge ${badge}`} aria-label={`Сложность: ${DIFFICULTY_LABELS[route.difficulty]}`}>
              {DIFFICULTY_LABELS[route.difficulty]}
            </span>
            <span>{route.author.name}</span>
            <time dateTime={route.publishedAt}>{formatDate(route.publishedAt)}</time>
          </p>
        </div>
      </Link>
    </article>
  );
}

export function RouteCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <article className="route-card route-card--compact route-card--skeleton" aria-hidden="true">
        <div className="thumb skeleton" />
        <div className="body">
          <div className="skeleton skeleton--text" style={{ width: "60%" }} />
          <div className="skeleton skeleton--text" style={{ width: "40%", marginTop: 8 }} />
        </div>
      </article>
    );
  }

  return (
    <article className="route-card route-card--skeleton" aria-hidden="true">
      <div className="thumb skeleton" />
      <div className="body">
        <div className="skeleton skeleton--text" style={{ width: "70%" }} />
        <div className="skeleton skeleton--text" style={{ width: "50%", marginTop: 12 }} />
        <div className="skeleton skeleton--text" style={{ width: "30%", marginTop: 8 }} />
      </div>
    </article>
  );
}