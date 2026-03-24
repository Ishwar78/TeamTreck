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
import { CustomRole } from '../models/CustomRole';

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

/* ================= MEMBERS MANAGEMENT ================= */

router.put('/users/:id/hours', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const { workingHours } = req.body;
    if (!workingHours) throw new AppError('Working hours string is required', 400);

    const userToUpdate = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.auth!.company_id },
      { workingHours },
      { new: true }
    );

    if (!userToUpdate) throw new AppError('User not found', 404);

    res.json({ success: true, user: userToUpdate });
  } catch (err) {
    next(err);
  }
});

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
      const { email, role, workingHours } = req.body;

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
        workingHours: workingHours ? String(workingHours) : "9:00 AM to 6:00 PM",
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Send email
      try {
        console.log(`Sending invite email to ${email} with token ${token} for company ${company.name}`);
        const { sendInvitationEmail } = await import('../services/mail.service');
        await sendInvitationEmail(email, token, company.name, workingHours ? String(workingHours) : "9:00 AM to 6:00 PM");
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

router.post(
  '/invites/message',
  authenticate,
  requireRole('company_admin'),
  async (req, res, next) => {
    try {
      const { tokens, message } = req.body;
      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        throw new AppError('No users selected', 400);
      }
      if (!message) {
        throw new AppError('Message is required', 400);
      }

      const company = await Company.findById(req.auth!.company_id);
      if (!company) throw new AppError('Company not found', 404);

      const invitations = await Invitation.find({
        token: { $in: tokens },
        company_id: req.auth!.company_id,
        status: 'pending'
      });

      const { sendEmail } = await import('../utils/mailer');
      let sentCount = 0;

      for (const inv of invitations) {
        const emailSubject = `Message from ${company.name}`;
        const emailHtml = `<p>Hello,</p><p>${message.replace(/\n/g, '<br>')}</p>`;
        
        const success = await sendEmail(inv.email, emailSubject, emailHtml);
        if (success) {
          sentCount++;
        }
      }

      res.json({ success: true, message: `Successfully sent ${sentCount} messages` });
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

/* ================= GROUPS ================= */

import { Group } from '../models/Group';

router.get('/my-groups', authenticate, async (req, res, next) => {
  try {
    const groups = await Group.find({
      company_id: req.auth!.company_id,
      users: req.auth!.user_id
    }).populate('users', 'name email').lean();
    res.json({ success: true, groups });
  } catch (err) {
    next(err);
  }
});

router.get('/groups', authenticate, requireRole('company_admin', 'sub_admin'), async (req, res, next) => {
  try {
    // Populate users if frontend ever needs more details, but frontend handles length via users.length
    const groups = await Group.find({ company_id: req.auth!.company_id }).populate('users', 'name email').lean();
    res.json({ success: true, groups });
  } catch (err) {
    next(err);
  }
});

router.post('/groups', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const { name, userIds } = req.body;
    if (!name) throw new AppError('Group name is required', 400);

    const existingGroup = await Group.findOne({ name, company_id: req.auth!.company_id });
    if (existingGroup) throw new AppError('Group name already exists', 400);

    const group = await Group.create({
      name,
      company_id: req.auth!.company_id,
      users: userIds || []
    });

    res.status(201).json({ success: true, group });
  } catch (err) {
    next(err);
  }
});

router.put('/groups/:id', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const { name, userIds } = req.body;
    if (!name) throw new AppError('Group name is required', 400);

    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, company_id: req.auth!.company_id },
      { name, users: userIds || [] },
      { new: true }
    );

    if (!group) throw new AppError('Group not found', 404);

    res.json({ success: true, group });
  } catch (err) {
    next(err);
  }
});

router.delete('/groups/:id', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const group = await Group.findOneAndDelete({ _id: req.params.id, company_id: req.auth!.company_id });
    if (!group) throw new AppError('Group not found', 404);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/* ================= SEND NOTIFICATIONS ================= */
import { sendEmail } from '../utils/mailer';
import { Notification } from '../models/Notification';

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
    const notificationsToInsert = [];

    for (const user of users) {
      if (user.email) {
        const emailSubject = subject || `Notification from ${company.name} Admin`;
        const emailHtml = `<p>Hello ${user.name},</p><p>${message.replace(/\n/g, '<br>')}</p>`;
        
        const success = await sendEmail(user.email, emailSubject, emailHtml);
        if (success) {
          sentCount++;
          // prepare notification document
          notificationsToInsert.push({
            company_id: req.auth!.company_id,
            user_id: user._id,
            title: emailSubject,
            message: message,
            is_read: false
          });
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
    }

    res.json({ success: true, message: `Successfully sent ${sentCount} notifications`, sentCount });
  } catch (err) {
    next(err);
  }
});

/* ================= DIRECT USER CREATION (ROLE MANAGEMENT) ================= */

router.post('/users/create', authenticate, requireRole('company_admin'), async (req: any, res, next) => {
  try {
    const { name, email, password, role, custom_role_id } = req.body;
    if (!name || !email || !password || !role) {
      throw new AppError('Name, email, password, and role are required', 400);
    }

    const company = await Company.findById(req.auth!.company_id);
    if (!company) throw new AppError('Company not found', 404);

    // Limit check
    const currentUsersCount = await User.countDocuments({ company_id: company._id });
    const pendingInvitesCount = await Invitation.countDocuments({
      company_id: company._id,
      status: 'pending'
    });
    if (currentUsersCount + pendingInvitesCount >= company.max_users) {
      throw new AppError('User limit reached for your plan. Please upgrade.', 403);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) throw new AppError('User already exists in system', 400);

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      company_id: company._id,
      name,
      email: email.toLowerCase(),
      password_hash: hashed,
      role: custom_role_id ? 'custom' : role,
      custom_role_id: custom_role_id || undefined,
      status: 'active'
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

/* ================= UPDATE ROLE ================= */

router.put('/users/:id/role', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const { role, custom_role_id } = req.body;
    if (!role) throw new AppError('Role is required', 400);

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.auth!.company_id },
      { 
        role: custom_role_id ? 'custom' : role,
        custom_role_id: custom_role_id || null 
      },
      { new: true }
    );

    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, user });
  } catch(err) {
    next(err);
  }
});

/* ================= CUSTOM ROLES ================= */
router.post('/roles', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    if (!name) throw new AppError('Role name is required', 400);

    const role = await CustomRole.create({
      company_id: req.auth!.company_id,
      name,
      permissions: permissions || {}
    });

    res.status(201).json({ success: true, role });
  } catch (err) { next(err); }
});

router.get('/roles', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const roles = await CustomRole.find({ company_id: req.auth!.company_id });
    res.json({ success: true, roles });
  } catch (err) { next(err); }
});

router.put('/roles/:id', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    const role = await CustomRole.findOneAndUpdate(
      { _id: req.params.id, company_id: req.auth!.company_id },
      { name, permissions },
      { new: true }
    );
    if (!role) throw new AppError('Role not found', 404);
    res.json({ success: true, role });
  } catch (err) { next(err); }
});

router.delete('/roles/:id', authenticate, requireRole('company_admin'), async (req, res, next) => {
  try {
    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ custom_role_id: req.params.id });
    if (usersWithRole > 0) throw new AppError('Cannot delete role currently assigned to users', 400);

    const role = await CustomRole.findOneAndDelete({ _id: req.params.id, company_id: req.auth!.company_id });
    if (!role) throw new AppError('Role not found', 404);
    res.json({ success: true, message: 'Role deleted' });
  } catch (err) { next(err); }
});

export const companyRoutes = router;
