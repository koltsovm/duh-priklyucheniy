import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { meRoutesRouter } from "../modules/routes/me.routes";
import { publicRoutesRouter } from "../modules/routes/public.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "duh-priklyucheniy-api", time: new Date().toISOString() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users/me/routes", meRoutesRouter);
apiRouter.use("/routes", publicRoutesRouter);