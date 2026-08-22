import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Лёгкая защита private-раздела: если нет refresh-cookie сессии — на login.
// Токен проверяется сервером при каждом запросе к API (не доверяем cookie).
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.get("duh_refresh")?.value;
  const { pathname } = request.nextUrl;

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};