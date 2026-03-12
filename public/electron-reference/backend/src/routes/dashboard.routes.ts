import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { Session } from '../models/Session';
import { Screenshot } from '../models/Screenshot';
import { ActivityLog } from '../models/ActivityLog';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/stats',
  authenticate,
  requireRole('company_admin', 'sub_admin'),
  async (req, res, next) => {
    try {
      const companyId = req.auth!.company_id;

      const activeNow = await Session.countDocuments({
        company_id: companyId,
        status: 'active'
      });

      const screenshots = await Screenshot.countDocuments({
        company_id: companyId
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const hours = await ActivityLog.aggregate([
        {
          $match: {
            company_id: companyId,
            interval_start: { $gte: today, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000]
              }
            }
          }
        }
      ]);

      res.json({
        activeNow,
        screenshots,
        hoursToday: Math.round(hours[0]?.total || 0)
      });
    } catch (err) {
      next(err);
    }
  }
);
