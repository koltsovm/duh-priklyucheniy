import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET слишком короткий"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET слишком короткий"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_PHOTO_SIZE_MB: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Некорректные переменные окружения:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;