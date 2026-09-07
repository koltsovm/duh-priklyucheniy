import { ApiError } from "@duh/shared";
import type { RequestHandler, NextFunction } from "express";
import type { AuthenticatedRequest, AuthenticatedRequestHandler } from "../types/express";

/** Оборачивает async-роуты, чтобы не дублировать try/catch. */
export const asyncHandler =
  (fn: (req: Express.Request, res: Express.Response, next: NextFunction) => Promise<unknown>) =>
  (req: Express.Request, res: Express.Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

export { ApiError, AuthenticatedRequest, AuthenticatedRequestHandler };