import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Invitation } from '../models/Invitation';
import { Plan } from '../models/Plan';
import { AppError } from '../utils/errors';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard'; 

const router = Router();

/* ================= REGISTER ================= */

const schema = z.object({
  companyName: z.string().min(2),
  domain: z.string().min(2),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const { companyName, domain, adminName, email, password } = parsed.data;

    const existing = await Company.findOne({ domain: domain.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Domain already exists' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const company = await Company.create({
      name: companyName,
      domain: domain.toLowerCase(),
      subscription: {
        status: 'trialing',
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Day Free Trial
        cancel_at_period_end: false,
      },
    });

    const admin = await User.create({
      company_id: company._id,
      email: email.toLowerCase(),
      password_hash: hashed,
      name: adminName,
      role: 'company_admin',
      status: 'active',
    });

    res.status(201).json({
      company: company._id,
      admin: admin._id,
    });
  } catch (err) {
    next(err);
  }
});

/* ================= LIST USERS ================= */

router.get(
  '/users',
  authenticate,
  requireRole('company_admin', 'sub_admin'),
  async (req, res) => {
    console.log('Entering /users handler, company_id:', req.auth!.company_id);
    const users: any = await User.find({
      company_id: req.auth!.company_id,
      role: { $ne: 'super_admin' },
    }).select('-password_hash').lean();

    // Check online status (ActiveLog in last 5 minutes)
    const { ActivityLog } = await import('../models/ActivityLog');
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeUsers = await ActivityLog.distinct('user_id', {
      company_id: req.auth!.company_id,
      timestamp: { $gte: fiveMinsAgo }
    });

    const activeUserIdsMap = new Set(activeUsers.map(id => id.toString()));

    const usersWithStatus = users.map((u: any) => ({
      ...u,
      isActive: activeUserIdsMap.has(u._id.toString())
    }));

    res.json({ users: usersWithStatus });
  }
);

/* ================= DETAILS ================= */

router.get(
  '/details',
  authenticate,
  requireRole('company_admin', 'sub_admin'),
  async (req, res, next) => {
    try {
      const company = await Company.findById(req.auth!.company_id).populate('plan_id').lean();
      if (!company) throw new AppError('Company not found', 404);

      res.json({ success: true, company });
    } catch (err) {
      next(err);
    }
  }
);

/* ================= INVITATIONS ================= */

router.get(
  '/invites',
  authenticate,
  requireRole('company_admin', 'sub_admin'),
  async (req, res) => {
    const invites = await Invitation.find({
      company_id: req.auth!.company_id,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json({ invites });
  }
);

router.post(
  '/invites',
  authenticate,
  requireRole('company_admin'),
  async (req, res, next) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        throw new AppError('Email and role are required', 400);
      }

      const company = await Company.findById(req.auth!.company_id);
      if (!company) throw new AppError('Company not found', 404);

      // Check user limit
      const currentUsersCount = await User.countDocuments({ company_id: company._id });
      const pendingInvitesCount = await Invitation.countDocuments({
        company_id: company._id,
        status: 'pending'
      });

      if (currentUsersCount + pendingInvitesCount >= company.max_users) {
        throw new AppError('User limit reached for your plan. Please upgrade.', 403);
      }

      // Check if already invited or exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) throw new AppError('User already exists in system', 400);

      const existingInvite = await Invitation.findOne({
        email: email.toLowerCase(),
        company_id: company._id,
        status: 'pending'
      });
      if (existingInvite) throw new AppError('Invitation already sent to this email', 400);

      const token = crypto.randomBytes(20).toString('hex');
      const invitation = await Invitation.create({
        email: email.toLowerCase(),
        company_id: company._id,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Send email
      try {
        console.log(`Sending invite email to ${email} with token ${token} for company ${company.name}`);
        const { sendInvitationEmail } = await import('../services/mail.service');
        await sendInvitationEmail(email, token, company.name);
        console.log('Invite email sent successfully');
      } catch (emailErr) {
        console.error('Failed to send invite email:', emailErr);
        await Invitation.findByIdAndDelete(invitation._id);
        throw new AppError('Failed to send invitation email. Please check your SMTP configuration.', 500);
      }

      res.status(201).json({ success: true, invitation });
    } catch (err) {
      next(err);
    }
  }
);

/* ================= SUPPORT TICKETS (COMPANY VISIBLE) ================= */

import { SupportTicket } from '../models/SupportTicket';

router.get('/tickets', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ companyId: req.auth!.company_id })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
});

router.post('/tickets', authenticate, requireRole('company_admin'), async (req: any, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) throw new AppError('Title and description required', 400);

    const ticket = await SupportTicket.create({
      companyId: req.auth!.company_id,
      createdBy: req.auth!.user_id,
      title,
      description,
      status: 'Open',
      replies: []
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

router.post('/tickets/:id/reply', authenticate, requireRole('company_admin'), async (req: any, res, next) => {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const ticket = await SupportTicket.findOne({ _id: req.params.id, companyId: req.auth!.company_id });
    if (!ticket) throw new AppError('Ticket not found', 404);

    ticket.replies.push({
      senderModel: 'User',
      senderId: req.auth!.user_id,
      message,
      createdAt: new Date()
    });

    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

/* ================= SEND NOTIFICATIONS ================= */
import { sendEmail } from '../utils/mailer';

router.post('/notifications/send', authenticate, requireRole('company_admin'), async (req: any, res, next) => {
  try {
    const { userIds, subject, message } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError('No users selected', 400);
    }
    if (!message) {
      throw new AppError('Message is required', 400);
    }

    const company = await Company.findById(req.auth!.company_id);
    if (!company) throw new AppError('Company not found', 404);

    const users = await User.find({
      _id: { $in: userIds },
      company_id: req.auth!.company_id 
    });

    let sentCount = 0;
    for (const user of users) {
      if (user.email) {
        const emailSubject = subject || `Notification from ${company.name} Admin`;
        const emailHtml = `<p>Hello ${user.name},</p><p>${message.replace(/\n/g, '<br>')}</p>`;
        const success = await sendEmail(user.email, emailSubject, emailHtml);
        if (success) sentCount++;
      }
    }

    res.json({ success: true, message: `Successfully sent ${sentCount} notifications`, sentCount });
  } catch (err) {
    next(err);
  }
});

export const companyRoutes = router;
