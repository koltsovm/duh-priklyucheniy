import { Router } from "express";
import { routeCreateSchema, routeUpdateSchema } from "@duh/shared";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { uploadPhotos } from "../../middleware/upload";
import { asyncHandler, ApiError, AuthenticatedRequest, AuthenticatedRequestHandler } from "../../lib/errors";
import { prisma } from "../../db/prisma";
import * as routeService from "./routes.service";

/**
 * Личный кабинет: /api/v1/users/me/routes
 * Все роуты требуют access-токен (Bearer).
 */
export const meRoutesRouter = Router();
meRoutesRouter.use(authenticate);

/**
 * Проверка, что маршрут :id принадлежит текущему пользователю.
 * Кладёт routeId в req.routeId и объект маршрута в req.routeEntity.
 */
const loadOwnedRoute: AuthenticatedRequestHandler = asyncHandler(async (req, _res, next) => {
  const route = await prisma.route.findFirst({
    where: { id: req.params.id, authorId: req.user.id },
  });
  if (!route) throw new ApiError(404, "Маршрут не найден");
  req.routeId = route.id;
  req.routeEntity = route;
  next();
});

meRoutesRouter.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const routes = await routeService.listMine(req.user.id);
    res.json(routes);
  }),
);

meRoutesRouter.post(
  "/",
  validate(routeCreateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const route = await routeService.createMine(req.user.id, req.body);
    res.status(201).json(route);
  }),
);

meRoutesRouter.get(
  "/:id",
  loadOwnedRoute,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const route = await routeService.getMine(req.user.id, req.params.id);
    res.json(route);
  }),
);

meRoutesRouter.patch(
  "/:id",
  loadOwnedRoute,
  validate(routeUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const route = await routeService.updateMine(req.user.id, req.params.id, req.body);
    res.json(route);
  }),
);

meRoutesRouter.delete(
  "/:id",
  loadOwnedRoute,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await routeService.deleteMine(req.user.id, req.params.id);
    res.status(204).end();
  }),
);

/** Загрузка фото: multipart, field "photos", до 5 файлов. */
meRoutesRouter.post(
  "/:id/photos",
  loadOwnedRoute,
  asyncHandler(async (req: AuthenticatedRequest, res, next) => {
    try {
      await new Promise<void>((resolve, reject) => {
        uploadPhotos(req, res, (err) => (err ? reject(err) : resolve()));
      });
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Файлы не загружены" });
      }
      const route = await routeService.addPhotos(req.user.id, req.routeId!, files);
      res.status(201).json(route);
    } catch (err) {
      next(err);
    }
  }),
);