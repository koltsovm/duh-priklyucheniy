import { RequestHandler } from "express";
import { ZodError, ZodSchema } from "zod";

type Source = "body" | "query" | "params";

/**
 * Валидирует входящие данные по zod-схеме из @duh/shared.
 * При ошибке — 400 со списком проблем; при успехе — заменяет поле
 * распарсенным значением (учитываются defaults/coercion).
 */
export function validate(schema: ZodSchema, source: Source = "body"): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const error = result.error as ZodError;
      return res.status(400).json({
        error: "Некорректные данные запроса",
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    (req as any)[source] = result.data;
    next();
  };
}