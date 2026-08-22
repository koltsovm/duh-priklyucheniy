import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { env } from "../config/env";

/** Подписывает короткоживущий access-token. */
export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

/** Верифицирует access-token, возвращает userId или null. */
export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Генерирует непредсказуемый refresh-token (opaque). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

/** Хэширует refresh-token для хранения в БД (потеря оригинального значения). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}