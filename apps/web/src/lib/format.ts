export function formatDistance(km: number | null): string {
  return typeof km === "number" ? `${Math.round(km).toLocaleString("ru-RU")} км` : "";
}

export function formatDuration(days: number | null): string {
  if (!days) return "";
  const suffix =
    days % 10 === 1 && days % 100 !== 11 ? "день" :
    [2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100) ? "дня" : "дней";
  return `${days} ${suffix}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}