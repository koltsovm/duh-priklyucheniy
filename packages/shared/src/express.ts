import type { RouteDto, UserDto } from ".";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      routeId?: string;
      routeEntity?: RouteDto;
    }
    interface User extends UserDto {}
  }
}

export {};