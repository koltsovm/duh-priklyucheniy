import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("duh_refresh")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

  try {
    if (refreshToken) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: `duh_refresh=${refreshToken}`,
        },
        credentials: "include",
      });
    }
  } catch {
    // Ignore errors - we're logging out anyway
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("duh_refresh", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}