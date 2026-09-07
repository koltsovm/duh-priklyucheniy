import "dotenv/config";
import "./types/express";
import { env } from "./config/env";
import { createApp } from "./app";
import { prisma } from "./db/prisma";

async function bootstrap() {
  const app = createApp();

  // Проверка соединения с БД при старте
  await prisma.$connect();
  console.log(`✅ БД подключена (${env.DATABASE_URL})`);

  app.listen(env.PORT, () => {
    console.log(`🚀 API «Дух приключений»: http://localhost:${env.PORT}/api/v1`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Не удалось запустить API:", err);
  process.exit(1);
});