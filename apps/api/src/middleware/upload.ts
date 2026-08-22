import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";
import { Request, RequestHandler } from "express";
import { env } from "../config/env";

function ensureUploadDirs(): void {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

ensureUploadDirs();

/**
 * Multer хранит файл в <UPLOAD_DIR>/<routeId>/<uuid>.<ext>.
 * Destination вычисляется после того, как middleware ownership
 * положил route.id в req.route.
 */
export const uploadPhotos: RequestHandler = multer({
  storage: multer.diskStorage({
    destination(req: Request, _file, cb) {
      // req.routeId устанавливается middleware loadOwnedRoute
      const routeId = (req as any).routeId;
      if (!routeId) {
        return cb(new Error("Не удалось определить маршрут для загрузки"));
      }
      const dir = path.join(env.UPLOAD_DIR, routeId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "");
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: env.MAX_PHOTO_SIZE_MB * 1024 * 1024,
    files: 5,
  },
  fileFilter(_req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Допускаются только изображения (JPEG, PNG, WEBP, GIF)"));
    }
    cb(null, true);
  },
}).array("photos", 5);