import { Router } from "express";
import { routeQuerySchema } from "@duh/shared";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/errors";
import * as routeService from "./routes.service";

export const publicRoutesRouter = Router();

/** Каталог: /api/v1/routes?page=1&limit=12&difficulty=easy&region=&sort=newest */
publicRoutesRouter.get(
  "/",
  validate(routeQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const result = await routeService.listPublished(req.query);
    res.json(result);
  }),
);

/** Деталь маршрута: /api/v1/routes/:slug */
publicRoutesRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const route = await routeService.getBySlug(req.params.slug);
    res.json(route);
  }),
);