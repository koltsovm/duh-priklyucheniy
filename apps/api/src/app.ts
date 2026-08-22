import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { apiRouter } from "./modules";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

/** Сборка Express-приложения (раздельно от listen — удобно для тестов). */
export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: env.WEB_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Статика для фото: /uploads/<routeId>/<file>
  app.use("/uploads", express.static(env.UPLOAD_DIR));

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}