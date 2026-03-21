import { Router } from 'express';
import { Notification } from '../models/Notification';
import { authenticate } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();

// Get user notifications mapping
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      user_id: req.auth!.user_id,
      company_id: req.auth!.company_id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user_id: req.auth!.user_id,
      company_id: req.auth!.company_id,
      is_read: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.auth!.user_id, company_id: req.auth!.company_id },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user_id: req.auth!.user_id, company_id: req.auth!.company_id, is_read: false },
      { is_read: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export const notificationRoutes = router;
