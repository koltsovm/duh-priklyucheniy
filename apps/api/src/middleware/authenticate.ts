import { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt";

/** Аутентификация по Bearer-токену; в req.user кладёт { id }. */
export const authenticate: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }
  const userId = verifyAccessToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Недействительный или истёкший токен" });
  }
  (req as any).user = { id: userId };
  next();
};