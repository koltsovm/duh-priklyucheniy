import Link from "next/link";
import { DIFFICULTY_LABELS } from "@duh/shared";
import type { RouteDto } from "@duh/shared";
import { formatDate, formatDuration } from "@/lib/format";
import { API_ORIGIN } from "@/lib/api-server";

export function RouteCard({ route }: { route: RouteDto }) {
  const cover = route.photos[0];
  const badge = `badge-${route.difficulty}`;
  const stats = [
    route.region ? `📍 ${route.region}` : null,
    route.distanceKm ? `🛣 ${formatDistance(route.distanceKm)}` : null,
    route.durationDays ? `⏱ ${formatDuration(route.durationDays)}` : null,
    `👁 ${route.viewCount}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/routes/${route.slug}`} className="route-card">
      <div className="thumb">
        {cover ? <img src={`${API_ORIGIN}${cover.url}`} alt={route.title} /> : "🏍"}
      </div>
      <div className="body">
        <h3>{route.title}</h3>
        <p className="meta">{stats}</p>
        <p className="meta" style={{ marginTop: 6 }}>
          <span className={`badge ${badge}`}>{DIFFICULTY_LABELS[route.difficulty]}</span>
          <span>{route.author.name}</span>
          <span>{formatDate(route.publishedAt)}</span>
        </p>
      </div>
    </Link>
  );
}

function formatDistance(km: number) {
  return `${km.toLocaleString("ru-RU")} км`;
}