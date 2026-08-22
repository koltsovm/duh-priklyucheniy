import { Response } from "express";
import { env } from "../config/env";

export const REFRESH_COOKIE_NAME = "duh_refresh";

/** Устанавливает refresh-token в httpOnly-cookie (устойчиво к XSS). */
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
}