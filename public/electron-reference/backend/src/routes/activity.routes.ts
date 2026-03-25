import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { enforceTenant } from '../middleware/tenantIsolation';
import { requireRole } from '../middleware/roleGuard'; 
import { validate } from '../middleware/validate';
import { ActivityLog } from '../models/ActivityLog';
import { TimeClaim } from '../models/TimeClaim';

const router = Router();

router.use(authenticate, enforceTenant);

/* =======================================================
   VALIDATION SCHEMA
======================================================= */

const schema = z.object({
  session_id: z.string(),
  logs: z.array(
    z.object({
      timestamp: z.string().datetime(),
      interval_start: z.string().datetime(),
      interval_end: z.string().datetime(),
      keyboard_events: z.number().optional(),
      mouse_events: z.number().optional(),
      mouse_distance: z.number().optional(),
      activity_score: z.number().min(0).max(100),
      idle: z.boolean().optional(),
      active_window: z.object({
        title: z.string(),
        app_name: z.string(),
        url: z.string().optional(),
        category: z.string().optional()
      })
    })
  )
});

/* =======================================================
   CREATE ACTIVITY LOGS
======================================================= */

router.post('/', validate(schema), async (req, res) => {

  let totalDur = 0;
  let activeDur = 0;
  let idleDur = 0;
  let totalScore = 0;

  const docs = req.body.logs.map((log: any) => {
    const start = new Date(log.interval_start).getTime();
    const end = new Date(log.interval_end).getTime();
    const durSecs = Math.max(0, Math.floor((end - start) / 1000));

    totalDur += durSecs;
    if (log.idle) idleDur += durSecs;
    else activeDur += durSecs;

    totalScore += (log.activity_score || 0) * durSecs;

    return {
      user_id: req.auth!.user_id,
      company_id: req.auth!.company_id,
      session_id: new Types.ObjectId(req.body.session_id),

      timestamp: new Date(log.timestamp),
      interval_start: new Date(log.interval_start),
      interval_end: new Date(log.interval_end),

      keyboard_events: log.keyboard_events || 0,
      mouse_events: log.mouse_events || 0,
      mouse_distance: log.mouse_distance || 0,
      activity_score: log.activity_score,
      idle: log.idle || false,

      active_window: {
        title: log.active_window.title,
        app_name: log.active_window.app_name,
        url: log.active_window.url || "",
        category: log.active_window.category || "Other"
      }
    };
  });

  await ActivityLog.insertMany(docs);

  // Update session summary
  if (totalDur > 0 && req.body.session_id) {
    const session = await import('../models/Session').then(m => m.Session).catch(() => null);
    if (session) {
      // Calculate new moving average for activity_score
      const sessDoc = await session.findById(req.body.session_id);
      if (sessDoc) {
        const oldTotal = sessDoc.summary?.total_duration || 0;
        const oldScore = sessDoc.summary?.activity_score || 0;
        const newTotal = oldTotal + totalDur;
        const newAvg = newTotal > 0 ? ((oldScore * oldTotal) + totalScore) / newTotal : 0;

        await session.findByIdAndUpdate(req.body.session_id, {
          $inc: {
            "summary.total_duration": totalDur,
            "summary.active_duration": activeDur,
            "summary.idle_duration": idleDur
          },
          $set: { "summary.activity_score": newAvg }
        });
      }
    }
  }

  res.json({ success: true });
});

/* =======================================================
   TIMELINE DATA (USED BY FRONTEND)
======================================================= */

router.get('/timeline', async (req, res) => {
  let { user_id, start_date, end_date } = req.query;

  // Employees, interns and standard users can only see their own timeline
  if (req.auth!.role === 'employee' || req.auth!.role === 'intern' || req.auth!.role === 'user') {
    user_id = req.auth!.user_id;
  }

  const logs = await ActivityLog.find({
    user_id,
    company_id: req.auth!.company_id,
    timestamp: {
      $gte: new Date(start_date as string),
      $lte: new Date(end_date as string)
    }
  })
    .sort({ interval_start: 1 })
    .lean();

  // Fetch approved claims for this period
  const claims = await TimeClaim.find({
    user_id,
    company_id: req.auth!.company_id,
    status: 'approved',
    date: {
      $gte: new Date(start_date as string).toISOString().split('T')[0],
      $lte: new Date(end_date as string).toISOString().split('T')[0]
    }
  }).lean();

  // Overlay claims on logs - ensuring they show as active (idle: false)
  const updatedLogs = logs.map(log => {
      const logStart = new Date(log.interval_start).getTime();
      const logEnd = new Date(log.interval_end).getTime();
      
      const isClaimed = claims.some(claim => {
          const claimDate = claim.date; // YYYY-MM-DD
          const cStart = new Date(`${claimDate}T${claim.startTime.length === 5 ? claim.startTime + ':00' : claim.startTime}`).getTime();
          const cEnd = new Date(`${claimDate}T${claim.endTime.length === 5 ? claim.endTime + ':00' : claim.endTime}`).getTime();
          
          return logStart < cEnd && logEnd > cStart;
      });

      if (isClaimed) {
          return { ...log, idle: false };
      }
      return log;
  });

  res.json({ success: true, logs: updatedLogs, claims });
});

/* =======================================================
   USAGE AGGREGATION (APPS + URLS)
======================================================= */

router.get('/usage', async (req, res, next) => {
  try {
    const { userId, period } = req.query;
    const companyId = req.auth!.company_id;

    let startDate = new Date();

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    const match: any = {
      company_id: new Types.ObjectId(companyId as string),
      timestamp: { $gte: startDate }
    };

    const isAdmin = req.auth!.role === 'company_admin' || req.auth!.role === 'sub_admin' || req.auth!.role === 'super_admin' || req.auth!.role === 'custom';
    
    if (userId && userId !== 'all') {
      // If not admin, force their own ID
      const targetUserId = isAdmin ? userId : req.auth!.user_id;
      match.user_id = new Types.ObjectId(targetUserId as string);
    } else if (!isAdmin) {
      // If not admin and no userId/all, force their own ID
      match.user_id = new Types.ObjectId(req.auth!.user_id as string);
    }

    /* ================= APPS ================= */

    const apps = await ActivityLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$active_window.app_name",
          totalSeconds: {
            $sum: {
              $divide: [
                { $subtract: ["$interval_end", "$interval_start"] },
                1000
              ]
            }
          },
          users: { $addToSet: "$user_id" },
          category: { $first: "$active_window.category" },
          intervals: {
            $push: {
              start: "$interval_start",
              end: "$interval_end"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          seconds: { $round: ["$totalSeconds", 0] },
          users: { $size: "$users" },
          category: { $ifNull: ["$category", "Other"] },
          intervals: 1
        }
      },
      { $sort: { seconds: -1 } }
    ]);

    /* ================= APP URLS (NESTED) ================= */
    const appUrls = await ActivityLog.aggregate([
      {
        $match: {
          ...match,
          "active_window.url": { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: {
            app: "$active_window.app_name",
            url: "$active_window.url"
          },
          totalSeconds: {
            $sum: {
              $divide: [
                { $subtract: ["$interval_end", "$interval_start"] },
                1000
              ]
            }
          },
          visits: { $sum: 1 }
        }
      },
      {
        $sort: { totalSeconds: -1 }
      },
      {
        $group: {
          _id: "$_id.app",
          urls: {
            $push: {
              url: "$_id.url",
              seconds: { $round: ["$totalSeconds", 0] },
              visits: "$visits"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          appName: "$_id",
          urls: { $slice: ["$urls", 10] } // Limit to top 10 URLs per app
        }
      }
    ]);

    // Merge URLs into apps
    const appsWithUrls = apps.map(app => {
      const urlData = appUrls.find(u => u.appName === app.name);
      return {
        ...app,
        children: urlData ? urlData.urls : []
      };
    });

    /* ================= URLS ================= */

    const urls = await ActivityLog.aggregate([
      {
        $match: {
          ...match,
          "active_window.url": { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$active_window.url",
          totalSeconds: {
            $sum: {
              $divide: [
                { $subtract: ["$interval_end", "$interval_start"] },
                1000
              ]
            }
          },
          visits: { $sum: 1 },
          category: { $first: "$active_window.category" },
          intervals: {
            $push: {
              start: "$interval_start",
              end: "$interval_end"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          url: "$_id",
          seconds: { $round: ["$totalSeconds", 0] },
          visits: 1,
          category: { $ifNull: ["$category", "Web"] },
          intervals: 1
        }
      },
      { $sort: { seconds: -1 } }
    ]);

    res.json({
  success: true,
  apps: appsWithUrls,
  urls
});

  } catch (err) {
    next(err);
  }
});

/* =======================================================
   PRODUCTIVITY %
======================================================= */

router.get('/productivity', async (req, res) => {

  const result = await ActivityLog.aggregate([
    {
      $match: {
        company_id: new Types.ObjectId(req.auth!.company_id)
      }
    },
    {
      $group: {
        _id: "$user_id",
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ["$idle", false] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        user_id: "$_id",
        productivity: {
          $round: [
            { $multiply: [{ $divide: ["$active", "$total"] }, 100] },
            0
          ]
        }
      }
    }
  ]);

  res.json({ success: true, data: result });
});

export const activityRoutes = router;
