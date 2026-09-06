import { Router } from "express";
import type { RequestHandler } from "express";
import {
  loginSchema,
  refreshResponseSchema,
  registerSchema,
} from "@duh/shared";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { rateLimit } from "../../middleware/rateLimit";
import { asyncHandler } from "../../lib/errors";
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from "../../lib/cookies";
import * as authService from "./auth.service";

function toUserDto(user: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

const register: RequestHandler = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await authService.registerUser(input);
  const tokens = await authService.issueTokens(user.id);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(201).json({ user: toUserDto(user), accessToken: tokens.accessToken });
});

const login: RequestHandler = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await authService.loginUser(input);
  const tokens = await authService.issueTokens(user.id);
  setRefreshCookie(res, tokens.refreshToken);
  res.json({ user: toUserDto(user), accessToken: tokens.accessToken });
});

const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const oldRefresh = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!oldRefresh) {
    return res.status(401).json({ error: "Refresh-токен отсутствует" });
  }
  const { accessToken, refreshToken } = await authService.refreshTokens(oldRefresh);
  setRefreshCookie(res, refreshToken);
  res.json(refreshResponseSchema.parse({ accessToken }));
});

const logout: RequestHandler = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logoutUser(refreshToken);
  clearRefreshCookie(res);
  res.status(204).end();
});

const me: RequestHandler = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  res.json({ user: toUserDto(user) });
});

export const authRouter = Router();

// Жёсткий rate-limit на точки авторизации
const authLimiter = rateLimit(20, 60_000);
authRouter.post("/register", authLimiter, validate(registerSchema), register);
authRouter.post("/login", authLimiter, validate(loginSchema), login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);