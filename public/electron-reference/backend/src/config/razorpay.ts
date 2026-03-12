import Razorpay from 'razorpay';
import { env } from './env';

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID.trim(),
  key_secret: env.RAZORPAY_KEY_SECRET.trim(),
});
