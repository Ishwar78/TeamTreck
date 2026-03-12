import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { authenticate } from "../middleware/auth";
import { enforceTenant } from "../middleware/tenantIsolation";
import { requireRole } from "../middleware/roleGuard";
import { Screenshot } from "../models/Screenshot";
import { AppError } from "../utils/errors";

const router = Router();

/* ================= LOCAL UPLOAD FOLDER ================= */

const uploadDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ================= AGENT UPLOAD ================= */

router.post(
  "/",
  authenticate,
  enforceTenant,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError("No file uploaded", 400);
      if (!req.body.session_id)
        throw new AppError("Missing session_id", 400);

      const screenshot = await Screenshot.create({
        user_id: req.auth!.user_id,
        company_id: req.auth!.company_id,
        session_id: req.body.session_id,
        timestamp: req.body.timestamp
          ? new Date(req.body.timestamp)
          : new Date(),
        s3_key: req.file.filename,
        file_size: req.file.size,
        resolution: {
          width: Number(req.body.resolution_width || 1280),
          height: Number(req.body.resolution_height || 720),
        },
        activity_score: Number(req.body.activity_score || 0),
        active_window: {
          title: req.body.window_title || "",
          app_name: req.body.app_name || "",
        },
        blurred: false,
      });

      if (req.body.session_id) {
        const session = await import('../models/Session').then(m => m.Session).catch(() => null);
        if (session) {
          await session.findByIdAndUpdate(req.body.session_id, {
            $inc: { "summary.screenshots_count": 1 }
          });
        }
      }

      res.status(201).json({
        success: true,
        id: screenshot._id,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ================= ADMIN LIST ================= */

router.get(
  "/:userId",
  authenticate,
  enforceTenant,
  requireRole("company_admin", "sub_admin"),
  async (req, res, next) => {
    try {
      const screenshots = await Screenshot.find({
        company_id: req.auth!.company_id,
        user_id: req.params.userId,
      })
        .sort({ timestamp: -1 })
        .lean();

      res.json({ screenshots });
    } catch (err) {
      next(err);
    }
  }
);

/* ================= VIEW (NO AUTH MIDDLEWARE) ================= */

router.get("/view/:id", async (req, res, next) => {
  try {
    const shot = await Screenshot.findById(req.params.id);
    if (!shot) throw new AppError("Screenshot not found", 404);

    const filePath = path.join(uploadDir, shot.s3_key);
    if (!fs.existsSync(filePath)) {
      throw new AppError("File not found on server", 404);
    }

    // Detect extension
    const ext = path.extname(filePath).toLowerCase();

    let contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".webp") contentType = "image/webp";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});
/* ================= DOWNLOAD ================= */

router.get("/download/:id", async (req, res, next) => {
  try {
    const shot = await Screenshot.findById(req.params.id);
    if (!shot) throw new AppError("Screenshot not found", 404);

    const filePath = path.join(uploadDir, shot.s3_key);
    if (!fs.existsSync(filePath)) {
      throw new AppError("File not found on server", 404);
    }

    res.download(filePath, `screenshot-${shot._id}.png`);
  } catch (err) {
    next(err);
  }
});

/* ================= DOWNLOAD ALL AS ZIP ================= */

router.get(
  "/download-all/:userId",
  authenticate,
  enforceTenant,
  requireRole("company_admin", "sub_admin"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const screenshots = await Screenshot.find({
        company_id: req.auth!.company_id,
        user_id: userId,
      });

      if (screenshots.length === 0) {
        throw new AppError("No screenshots found for this user", 404);
      }

      const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
      });

      res.attachment(`screenshots-${userId}-${Date.now()}.zip`);

      archive.on("error", (err) => {
        throw err;
      });

      archive.pipe(res);

      for (const shot of screenshots) {
        const filePath = path.join(uploadDir, shot.s3_key);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `${formatDate(shot.timestamp)}-${shot._id}.png` });
        }
      }

      await archive.finalize();
    } catch (err) {
      next(err);
    }
  }
);

// Helper for filename
function formatDate(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

export const screenshotRoutes = router;