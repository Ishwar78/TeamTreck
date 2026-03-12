import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Plan } from '../models/Plan';
import { AppError } from '../utils/errors';
import { DemoInquiry } from "../models/DemoInquiry";
import { sendCompanyCreatedEmail } from '../services/mail.service';
import { SupportTicket } from '../models/SupportTicket';
const router = Router();

/* ================= PLANS ================= */

// GET Plans
router.get('/plans', authenticate, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).lean();

    // Add active company count
    const plansWithCount = await Promise.all(plans.map(async (p) => {
      const activeCount = await Company.countDocuments({ plan_id: p._id, 'subscription.status': { $in: ['active', 'trialing'] } });
      return { ...p, active: activeCount };
    }));

    res.json({ success: true, data: plansWithCount });
  } catch (err) { next(err); }
});

// CREATE Plan
router.post('/plans', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) { next(err); }
});

// UPDATE Plan
router.put('/plans/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.body.price_monthly !== undefined) {
      // Update MRR for all companies with this plan
      await Company.updateMany(
        { plan_id: req.params.id },
        { mrr: req.body.price_monthly }
      );
    }

    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
});

// DELETE Plan
router.delete('/plans/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    await Plan.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) { next(err); }
});


/* ================= COMPANIES ================= */

// GET Companies
router.get('/companies', authenticate, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const companies = await Company.find().populate('plan_id').sort({ created_at: -1 }).lean();

    const companiesWithData = await Promise.all(companies.map(async (c) => {
      const usersCount = await User.countDocuments({ company_id: c._id });
      const admin = await User.findOne({ company_id: c._id, role: 'company_admin' }).select('email').lean();

      const plan: any = c.plan_id || {};

      return {
        id: c._id,
        name: c.name,
        email: admin?.email || (c.subscription as any)?.stripe_customer_id || 'N/A', // fallback
        plan: plan.name || 'Unknown',
        users: usersCount,
        maxUsers: plan.max_users || c.max_users,
        mrr: c.mrr,
        country: c.country,
        status: c.subscription.status === 'active' ? 'active' : c.subscription.status === 'trialing' ? 'trial' : 'suspended',
        joined: c.created_at
      };
    }));

    res.json({ success: true, data: companiesWithData });
  } catch (err) { next(err); }
});

// POST Company
router.post('/company', authenticate, requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, domain, adminEmail, adminPassword, plan_name, country } = req.body;

    if (!name || !adminEmail || !adminPassword || !plan_name) {
      throw new AppError('Missing fields', 400);
    }

    const plan = await Plan.findOne({ name: plan_name });
    if (!plan) throw new AppError('Invalid Plan', 400);

    const company = await Company.create({
      name,
      domain,
      plan_id: plan._id,
      country: country || 'US',
      mrr: plan.price_monthly,
      max_users: plan.max_users, // Cache it
      subscription: { status: plan.price_monthly === 0 ? 'trialing' : 'active' } // Simple logic for now
    });

    const hashed = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      company_id: company._id,
      email: adminEmail,
      password_hash: hashed,
      name: 'Company Admin',
      role: 'company_admin',
      status: 'active',
    });

    // Send the email to the admin with their password
    try {
      await sendCompanyCreatedEmail(adminEmail, name, adminPassword);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // We don't throw an error here because the company was created successfully.
    }

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (err) {
    next(err);
  }
});

// UPDATE Company
router.put('/companies/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { plan_name, status } = req.body;
    const update: any = {};

    if (plan_name) {
      const plan = await Plan.findOne({ name: plan_name });
      if (plan) {
        update.plan_id = plan._id;
        update.mrr = plan.price_monthly;
        update.max_users = plan.max_users;
      }
    }

    if (status) { // map frontend status to subscription status
      if (status === 'active') update['subscription.status'] = 'active';
      if (status === 'suspended') update['subscription.status'] = 'canceled'; // or similar
      // For simplicity
    }

    await Company.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true });
  } catch (err) { next(err); }
});


// DELETE Company
router.delete('/companies/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const companyId = req.params.id;
    // 1. Delete all users belonging to this company
    await User.deleteMany({ company_id: companyId });
    // 2. Delete the company
    await Company.findByIdAndDelete(companyId);

    res.json({ success: true, message: 'Company and associated users deleted successfully' });
  } catch (err) { next(err); }
});

/* ================= USERS ================= */

router.get('/users', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { search, company, role } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    // For Company filter, we need company_id. 
    // Frontend passes Company Name, so we need to find Company first, or Populate matches.
    // Easier: User.find(query).populate({ path: 'company_id', match: { name: company } })
    // But then we need to filter empty populated.
    // Let's assume frontend passes Company Name.

    let dbQuery = User.find(query).populate('company_id').sort({ created_at: -1 });

    const users = await dbQuery.lean();

    const formatted = users.map((u: any) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      company: u.company_id?.name || 'Unknown',
      role: u.role,
      status: u.status,
      lastSeen: u.last_seen || u.createdAt
    }));

    // Filter by company if provided (since populate match is tricky with this structure)
    const final = (company && company !== 'all')
      ? formatted.filter(u => u.company === company)
      : formatted;

    res.json({ success: true, data: final });
  } catch (err) { next(err); }
});


// DELETE User
router.delete('/users/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) { next(err); }
});

/* ================= ANALYTICS ================= */

router.get('/analytics', authenticate, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ 'subscription.status': 'active' });
    const totalUsers = await User.countDocuments();

    const companies = await Company.find().select('mrr created_at').lean();
    const totalMRR = companies.reduce((sum, c) => sum + (c.mrr || 0), 0);

    // Monthly Growth (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    // Aggregate new companies by month
    const companiesGrowth = await Company.aggregate([
      { $match: { created_at: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
          count: { $sum: 1 },
          mrr: { $sum: "$mrr" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for chart
    const growthData = companiesGrowth.map(g => ({
      name: g._id,
      companies: g.count,
      revenue: g.mrr
    }));

    res.json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        totalUsers,
        totalMRR,
        growthData
      }
    });
  } catch (err) { next(err); }
});

/* ================= SETTINGS ================= */

// Mock settings store (In real app, use a Settings model)
let platformSettings = {
  allowSignups: true,
  defaultTrialDays: 14,
  maintenanceMode: false,
  supportEmail: "support@webm.com"
};

router.get('/settings', authenticate, requireRole('super_admin'), async (_req, res) => {
  res.json({ success: true, data: platformSettings });
});

router.put('/settings', authenticate, requireRole('super_admin'), async (req, res) => {
  platformSettings = { ...platformSettings, ...req.body };
  res.json({ success: true, data: platformSettings });
});
/* =======================================================
   GET DEMO INQUIRIES (SUPER ADMIN)
======================================================= */

/* =======================================================
   GET DEMO INQUIRIES
======================================================= */

router.get(
  "/demo-inquiries",
  authenticate,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const data = await DemoInquiry.find().sort({ createdAt: -1 });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error fetching demo inquiries:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

/* =======================================================
   SUPPORT TICKETS
======================================================= */

// GET all support tickets
router.get("/tickets", authenticate, requireRole("super_admin"), async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('companyId', 'name')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
});

// REPLY to a support ticket
router.post("/tickets/:id/reply", authenticate, requireRole("super_admin"), async (req: any, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    ticket.replies.push({
      senderModel: 'SuperAdmin',
      senderId: req.auth.user_id,
      message,
      createdAt: new Date()
    });

    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

// UPDATE ticket status
router.put("/tickets/:id/status", authenticate, requireRole("super_admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

export const superAdminRoutes = router;
