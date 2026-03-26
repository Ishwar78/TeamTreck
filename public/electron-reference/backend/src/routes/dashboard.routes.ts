import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { Session } from '../models/Session';
import { Screenshot } from '../models/Screenshot';
import { ActivityLog } from '../models/ActivityLog';
import { User } from '../models/User';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/stats',
  authenticate,
  requireRole('company_admin', 'sub_admin'),
  async (req, res, next) => {
    try {
      const companyId = req.auth!.company_id;

      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeNow = await ActivityLog.distinct('user_id', {
        company_id: companyId,
        timestamp: { $gte: fiveMinsAgo }
      }).then(uids => uids.length);

      const totalUsers = await User.countDocuments({
        company_id: companyId,
        role: { $ne: 'super_admin' }
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
        totalUsers,
        screenshots,
        hoursToday: Math.round(hours[0]?.total || 0)
      });
    } catch (err) {
      next(err);
    }
  }
);
