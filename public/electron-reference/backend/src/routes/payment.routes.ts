import { Router } from 'express';
import crypto from 'crypto';
import { razorpay } from '../config/razorpay';
import { Plan } from '../models/Plan';
import { Company } from '../models/Company';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

const router = Router();

/* ================= HELPER ================= */

// ✅ Exact next month date (no fixed 30 days)
const getNextBillingDate = () => {
  const now = new Date();
  const next = new Date(now);
  next.setMonth(next.getMonth() + 1);
  return next;
};

/* ================= GET KEY ================= */
router.get('/key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || '' });
});

/* ================= CREATE ORDER ================= */

router.post('/create-order', async (req, res, next) => {
  try {
    const { planId, companyId, regData } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const orderOptions: any = {
      amount: Math.round(plan.price_monthly * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    // If this is a new registration, store details in notes
    if (regData) {
      orderOptions.notes = {
        regData: JSON.stringify(regData)
      };
    }

    const order = await razorpay.orders.create(orderOptions);

    // Save order id if company already exists
    if (companyId) {
      await Company.findByIdAndUpdate(companyId, {
        'subscription.razorpay_order_id': order.id,
      });
    }

    res.json({ success: true, order });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

/* ================= VERIFY PAYMENT ================= */

router.post('/verify', async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = req.body;
    let { companyId } = req.body;

    // 🔐 1. Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // 🚀 2. DEFERRED REGISTRATION CHECK
    const order = await razorpay.orders.fetch(razorpay_order_id);
    if (order.notes && order.notes.regData) {
      const regData =
  typeof order.notes.regData === 'string'
    ? JSON.parse(order.notes.regData)
    : order.notes.regData;
      const { companyName, domain, adminName, email, password } = regData;

      // Double check availability (safety)
      const existing = await Company.findOne({ domain: domain.toLowerCase() });
      if (!existing) {
         // Create Company
         const company = await Company.create({
           name: companyName,
           domain: domain.toLowerCase(),
           subscription: { status: 'active' } // Will be updated below
         });
         companyId = company._id;

         // Create Admin
         const hashed = await bcrypt.hash(password, 10);
         await User.create({
           company_id: company._id,
           email: email.toLowerCase(),
           password_hash: hashed,
           name: adminName,
           role: 'company_admin',
           status: 'active',
         });
      } else {
        companyId = existing._id;
      }
    }

    const now = new Date();
    const nextBilling = getNextBillingDate();

    // ✅ 3. Activate/Update subscription
    await Company.findByIdAndUpdate(companyId, {
      plan_id: plan._id,
      max_users: plan.max_users,
      mrr: plan.price_monthly,
      is_active: true,
      subscription: {
        razorpay_order_id,
        razorpay_payment_id,
        status: 'active',
        current_period_start: now,
        current_period_end: nextBilling,
        cancel_at_period_end: false,
      },
    });

    res.json({ success: true, companyId });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

export const paymentRoutes = router;
