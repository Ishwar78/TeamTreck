import { Router, Request, Response, NextFunction } from 'express';
import { Plan } from '../models/Plan';
import { DemoInquiry } from "../models/DemoInquiry";
const router = Router();

/* =======================================================
   CONFIG
======================================================= */

const AGENT_VERSION = "v2.1.0";
const AGENT_BASE_PATH = `/uploads/agent/${AGENT_VERSION}`;

/* =======================================================
   GET PUBLIC PLANS
======================================================= */

router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const plans = await Plan.find({ isActive: true })
            .select('name price_monthly max_users features isPopular')
            .sort({ price_monthly: 1 })
            .lean();

        const formatted = plans.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price_monthly,
            users: p.max_users,
            features: p.features || [],
            popular: (p as any).isPopular || false
        }));

        res.json({ success: true, data: formatted });

    } catch (err) {
        next(err);
    }
});

/* =======================================================
   AGENT DOWNLOAD (OS AUTO-DETECT)
   Route: /api/public/download
======================================================= */

router.get('/download', (req: Request, res: Response) => {
    try {
        const ua = (req.headers['user-agent'] || '').toLowerCase();

        // Windows
        if (ua.includes('win')) {
            return res.redirect(
                `${AGENT_BASE_PATH}/webmok-agent-setup.exe`
            );
        }

        // macOS
        if (ua.includes('mac')) {
            return res.redirect(
                `${AGENT_BASE_PATH}/webmok-agent.dmg`
            );
        }

        // Linux (excluding Android)
        if (ua.includes('linux') && !ua.includes('android')) {
            return res.redirect(
                `${AGENT_BASE_PATH}/webmok-agent.AppImage`
            );
        }

        return res.status(400).json({
            success: false,
            message: "Unsupported operating system"
        });

    } catch (err) {
        console.error("Download route error:", err);
        return res.status(500).json({
            success: false,
            message: "Download failed"
        });
    }
});

/* =======================================================
   AGENT VERSION CHECK (For Auto Update)
   Route: /api/public/agent/version
======================================================= */

router.get('/agent/version', (_req: Request, res: Response) => {
    res.json({
        success: true,
        version: AGENT_VERSION
    });
});


router.post("/book-demo", async (req, res, next) => {
  try {
    const { name, email, phone, organisation, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    await DemoInquiry.create({
      name,
      email,
      phone,
      organisation,
      message,
    });

    res.json({ success: true, message: "Demo booked successfully" });
  } catch (err) {
    next(err);
  }
});

export const publicRoutes = router;
