import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { enforceTenant } from '../middleware/tenantIsolation';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { Session } from '../models/Session';
import { Company } from '../models/Company';
import { AppError } from '../utils/errors';
import { ActivityLog } from '../models/ActivityLog';

const router = Router();
router.use(authenticate, enforceTenant);

/* ================= VALIDATION ================= */

const startSchema = z.object({
  device_id: z.string().uuid(),
  timestamp: z.string().datetime(),
});

/* ================= START SESSION ================= */

router.post('/start', validate(startSchema), async (req, res) => {
  const { user_id, company_id } = req.auth!;

  const company = await Company.findById(company_id);
  if (!company) throw new AppError('Company not found', 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find any existing active/paused session
  let existing = await Session.findOne({
    user_id,
    company_id,
    status: { $in: ['active', 'paused'] },
  });

  if (existing) {
    if (existing.start_time < today) {
      // Session is from a previous day. End it.
      existing.status = 'ended';
      existing.end_time = new Date();
      existing.events.push({ type: 'end', timestamp: new Date() });
      await existing.save();
      existing = null; // Proceed to create a new session
    } else {
      // Session is from today
      return res.json({
        session_id: existing._id,
        message: 'Session already active'
      });
    }
  }

  const session = await Session.create({
    user_id,
    company_id,
    device_id: req.body.device_id,
    start_time: new Date(req.body.timestamp),
    status: 'active',
    events: [
      { type: 'start', timestamp: new Date(req.body.timestamp) },
    ],
  });

  res.status(201).json({
    session_id: session._id,
    startTime: session.start_time,
  });
});

/* ================= PAUSE ================= */

router.put('/:id/pause', async (req, res) => {
  const session = await Session.findOneAndUpdate(
    {
      _id: req.params.id,
      user_id: req.auth!.user_id,
      company_id: req.auth!.company_id,
      status: 'active',
    },
    {
      $set: { status: 'paused' },
      $push: { events: { type: 'pause', timestamp: new Date() } },
    },
    { new: true }
  );

  if (!session) throw new AppError('Active session not found', 404);

  res.json({ success: true });
});

/* ================= RESUME ================= */

router.put('/:id/resume', async (req, res) => {
  const session = await Session.findOneAndUpdate(
    {
      _id: req.params.id,
      user_id: req.auth!.user_id,
      company_id: req.auth!.company_id,
      status: 'paused',
    },
    {
      $set: { status: 'active' },
      $push: { events: { type: 'resume', timestamp: new Date() } },
    },
    { new: true }
  );

  if (!session) throw new AppError('Paused session not found', 404);

  res.json({ success: true });
});

/* ================= END (FIXED SAFE VERSION) ================= */

router.put('/:id/end', async (req, res) => {
  console.log("Ending session request:", {
    id: req.params.id,
    user: req.auth!.user_id,
    company: req.auth!.company_id
  });

  const session = await Session.findById(req.params.id);

  if (!session) {
    console.log("Session not found in DB");
    throw new AppError('Session not found', 404);
  }

  if (session.user_id.toString() !== req.auth!.user_id) {
    console.log("Unauthorized user trying to end session");
    throw new AppError('Unauthorized session access', 403);
  }

  if (session.company_id.toString() !== req.auth!.company_id) {
    console.log("Company mismatch");
    throw new AppError('Company mismatch', 403);
  }

  if (session.status === 'ended') {
    return res.json({ success: true, message: 'Session already ended' });
  }

  session.status = 'ended';
  session.end_time = new Date();
  session.events.push({ type: 'end', timestamp: new Date() });

  await session.save();

  res.json({ success: true });
});

/* ================= ADMIN ACTIVE SESSIONS ================= */

router.get(
  '/active',
  requireRole('company_admin', 'sub_admin'),
  async (req, res) => {
    const sessions = await Session.find({
      company_id: req.auth!.company_id,
      status: { $in: ['active', 'paused'] },
    })
      .populate('user_id', 'name email')
      .lean();

    res.json({ sessions });
  }
);

router.get(
  '/live-status',
  requireRole('company_admin', 'sub_admin'),
  async (req, res) => {

    const companyId = req.auth!.company_id;

    const activeSessions = await Session.find({
      company_id: companyId,
      status: 'active'
    }).populate('user_id', 'name email');

    const result = [];

    for (const session of activeSessions) {

      const lastLog = await ActivityLog.findOne({
        session_id: session._id
      }).sort({ timestamp: -1 });

      result.push({
        user: session.user_id,
        session_id: session._id,
        idle: lastLog?.idle || false,
        last_activity: lastLog?.timestamp || null
      });
    }

    res.json({ success: true, users: result });
  }
);

router.get(
  '/',
  requireRole('company_admin', 'sub_admin'),
  async (req, res) => {
    const { user_id, start_date, end_date } = req.query;
    const query: any = { company_id: req.auth!.company_id };

    if (user_id) query.user_id = user_id;
    if (start_date || end_date) {
      query.start_time = {};
      if (start_date) query.start_time.$gte = new Date(start_date as string);
      if (end_date) query.start_time.$lte = new Date(end_date as string);
    }

    const sessions = await Session.find(query)
      .populate('user_id', 'name email')
      .sort({ start_time: -1 });

    res.json({ sessions });
  }
);

export const sessionRoutes = router;