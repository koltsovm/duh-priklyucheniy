import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { RouteDto } from "@duh/shared";

export interface AuthenticatedRequest extends Request {
  user: { id: string };
  routeId?: string;
  routeEntity?: RouteDto;
}

export type AuthenticatedRequestHandler = RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  Record<string, string | string[] | undefined>
>;

export type TypedNextFunction = NextFunction;