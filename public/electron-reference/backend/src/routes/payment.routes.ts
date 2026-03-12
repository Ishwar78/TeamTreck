import { Router } from 'express';
import crypto from 'crypto';
import { razorpay } from '../config/razorpay';
import { Plan } from '../models/Plan';
import { Company } from '../models/Company';

const router = Router();

/* ================= GET KEY ================= */
router.get('/key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || '' });
});

/* ================= CREATE ORDER ================= */

router.post('/create-order', async (req, res, next) => {
  try {
    const { planId, companyId } = req.body;
    console.log('💳 Creating Razorpay order:', { planId, companyId });

    const plan = await Plan.findById(planId);
    if (!plan) {
      console.error('❌ Plan not found:', planId);
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    console.log('📦 Plan details:', { name: plan.name, price: plan.price_monthly });

    try {
      const order = await razorpay.orders.create({
        amount: Math.round(plan.price_monthly * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });

      console.log('✅ Razorpay order created:', order.id);

      // Save temporary order to company
      await Company.findByIdAndUpdate(companyId, {
        'subscription.razorpay_order_id': order.id,
      });

      res.json({ success: true, order });
    } catch (razorError: any) {
      console.error('❌ Razorpay Error:', razorError);
      return res.status(500).json({
        success: false,
        message: 'Razorpay order creation failed',
        error: razorError.description || razorError.message
      });
    }
  } catch (err) {
    console.error('❌ Create Order Unexpected Error:', err);
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

    // Activate subscription
    await Company.findByIdAndUpdate(companyId, {
      plan_id: plan._id,
      max_users: plan.max_users,
      mrr: plan.price_monthly,
      is_active: true,
      subscription: {
        razorpay_order_id,
        razorpay_payment_id,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Adds 30 days
        cancel_at_period_end: false,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export const paymentRoutes = router;
