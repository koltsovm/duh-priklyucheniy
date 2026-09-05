import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get("duh_refresh")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Cookie: `duh_refresh=${refreshToken}`,
      },
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}