import { Router } from 'express';
import { z } from 'zod';
import { TimeClaim } from '../models/TimeClaim';
import { ActivityLog } from '../models/ActivityLog';
import { Session } from '../models/Session';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { AppError } from '../utils/errors';

export const claimRoutes = Router();

/* ================= SUBMIT CLAIM (Employee) ================= */

const claimSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // Added optional seconds
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),   // Added optional seconds
    type: z.enum(['Meeting', 'Call', 'Break', 'Other']),
    reason: z.string().min(1, 'Reason is required'),
});

claimRoutes.post(
    '/',
    authenticate,
    async (req, res, next) => {
        try {
            const parsed = claimSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: parsed.error.errors[0].message,
                    details: parsed.error.errors
                });
            }

            const { date, startTime, endTime, type, reason } = parsed.data;

            // Calculate duration
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            const duration = endMinutes - startMinutes;

            if (duration <= 0) {
                throw new AppError('End time must be after start time', 400);
            }

            const claim = await TimeClaim.create({
                user_id: req.auth!.user_id,
                company_id: req.auth!.company_id,
                date,
                startTime,
                endTime,
                type,
                reason,
                duration,
                status: 'pending'
            });

            res.status(201).json({ success: true, claim });
        } catch (err) {
            next(err);
        }
    }
);

/* ================= LIST CLAIMS (Employee) ================= */

claimRoutes.get(
    '/my',
    authenticate,
    async (req, res, next) => {
        try {
            const claims = await TimeClaim.find({
                user_id: req.auth!.user_id
            }).sort({ createdAt: -1 });

            res.json({ claims });
        } catch (err) {
            next(err);
        }
    }
);

/* ================= LIST PENDING (Admin) ================= */

claimRoutes.get(
    '/pending',
    authenticate,
    requireRole('company_admin', 'sub_admin'),
    async (req, res, next) => {
        try {
            const claims = await TimeClaim.find({
                company_id: req.auth!.company_id,
                status: 'pending'
            })
                .populate('user_id', 'name email')
                .sort({ createdAt: -1 });

            res.json({ claims });
        } catch (err) {
            next(err);
        }
    }
);

/* ================= APPROVE/REJECT (Admin) ================= */

const actionSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    rejectionReason: z.string().optional()
});

claimRoutes.put(
    '/:id/action',
    authenticate,
    requireRole('company_admin', 'sub_admin'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status, rejectionReason } = actionSchema.parse(req.body);

            const claim = await TimeClaim.findById(id);
            if (!claim) throw new AppError('Claim not found', 404);

            if (claim.company_id.toString() !== req.auth!.company_id) {
                throw new AppError('Unauthorized', 403);
            }

            claim.status = status;
            if (status === 'rejected' && rejectionReason) {
                claim.rejectionReason = rejectionReason;
            }

            if (status === 'approved') {
                // Parse date more robustly. Assume dates are local and convert to UTC for DB matching if needed.
                // However, most internal dates should be handled as UTC.
                // Let's ensure we parse correctly.
                const parseDate = (d: string, t: string) => {
                    return new Date(`${d}T${t.length === 5 ? t + ':00' : t}`);
                };

                const claimStart = parseDate(claim.date, claim.startTime).getTime();
                const claimEnd = parseDate(claim.date, claim.endTime).getTime();

                // Find overlapping logs that are currently idle
                const logs = await ActivityLog.find({
                    user_id: claim.user_id,
                    company_id: claim.company_id,
                    idle: true,
                    interval_start: {
                        $gte: new Date(new Date(claim.date).setHours(0, 0, 0, 0)),
                        $lte: new Date(new Date(claim.date).setHours(23, 59, 59, 999))
                    }
                });

                const logsToUpdate = logs.filter((log: any) => {
                    const logStart = new Date(log.interval_start).getTime();
                    const logEnd = new Date(log.interval_end).getTime();
                    return logStart < claimEnd && logEnd > claimStart;
                });

                if (logsToUpdate.length > 0) {
                    const logIds = logsToUpdate.map(l => l._id);
                    await ActivityLog.updateMany(
                        { _id: { $in: logIds } },
                        { $set: { idle: false } }
                    );

                    // Update session summaries
                    // Group by session_id in case logs span multiple sessions
                    const sessionsMap = new Map<string, number>();
                    logsToUpdate.forEach((log: any) => {
                        const sid = log.session_id.toString();
                        const duration = Math.floor((new Date(log.interval_end).getTime() - new Date(log.interval_start).getTime()) / 1000);
                        sessionsMap.set(sid, (sessionsMap.get(sid) || 0) + duration);
                    });

                    for (const [sessionId, duration] of sessionsMap.entries()) {
                        await Session.findByIdAndUpdate(sessionId, {
                            $inc: {
                                "summary.active_duration": duration,
                                "summary.idle_duration": -duration
                            }
                        });
                    }
                }
            }

            await claim.save();

            res.json({ success: true, claim });
        } catch (err) {
            next(err);
        }
    }
);
