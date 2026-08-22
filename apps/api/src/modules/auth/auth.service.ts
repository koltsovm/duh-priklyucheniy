import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/errors";
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from "../../lib/jwt";
import { env } from "../../config/env";

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

/** Регистрация: проверка уникальности email + создание пользователя. */
export async function registerUser(input: { email: string; password: string; name: string }) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Пользователь с таким email уже существует");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: input.name.trim() },
  });
  return user;
}

/** Вход: проверка email+пароль. */
export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new ApiError(401, "Неверный email или пароль");
  }
  return user;
}

/** Создаёт сессию (refresh-токен) для пользователя, возвращает пару токенов. */
export async function issueTokens(userId: string) {
  const refreshToken = generateRefreshToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return {
    accessToken: signAccessToken(userId),
    refreshToken,
  };
}

/** Refresh-ротация: валидирует старый refresh, отзывает его, выдаёт новую пару. */
export async function refreshTokens(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!session) {
    throw new ApiError(401, "Сессия недействительна или истекла");
  }
  // Однократное использование refresh-токена (ротация)
  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  const tokens = await issueTokens(session.userId);
  return { ...tokens, user: session.user };
}

/** Выход: отзывает refresh-токен (если передан). */
export async function logoutUser(refreshToken?: string) {
  if (!refreshToken) return;
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}