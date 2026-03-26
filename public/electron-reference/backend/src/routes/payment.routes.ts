import { Router } from 'express';
import crypto from 'crypto';
import { razorpay } from '../config/razorpay';
import { Plan } from '../models/Plan';
import { Company } from '../models/Company';

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
    const { planId, companyId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(plan.price_monthly * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    // Save order id
    await Company.findByIdAndUpdate(companyId, {
      'subscription.razorpay_order_id': order.id,
    });

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
      companyId,
      planId
    } = req.body;

    // 🔐 Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false });
    }

    const now = new Date();
    const nextBilling = getNextBillingDate();

    // ✅ Activate subscription
    await Company.findByIdAndUpdate(companyId, {
      plan_id: plan._id,
      max_users: plan.max_users,
      mrr: plan.price_monthly,
      is_active: true,
      subscription: {
        razorpay_order_id,
        razorpay_payment_id,
        status: 'active',
        current_period_start: now,        // ✅ start date
        current_period_end: nextBilling,  // ✅ FIXED expiry date
        cancel_at_period_end: false,
      },
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

export const paymentRoutes = router;