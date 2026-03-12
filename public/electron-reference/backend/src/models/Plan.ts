import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
    name: string;
    price_monthly: number;
    max_users: number; // or string if 'Custom' capability needed, but user req says number. UI shows '25' or 'Custom' (string). Let's use Schema.Types.Mixed or String to be safe for 'Custom'. But user req says "max_users" (number-like). Let's stick to Number for now and 999999 for unlimited/custom if needed, or Mixed. Re-reading req: "max_users". UI mock data has "200" and "5" etc.
    screenshots_per_hour: number;
    data_retention: string;
    isActive: boolean;
    features: string[];
}

const PlanSchema = new Schema<IPlan>(
    {
        name: { type: String, required: true, trim: true },
        price_monthly: { type: Number, required: true, default: 0 },
        max_users: { type: Number, required: true, default: 5 },
        screenshots_per_hour: { type: Number, default: 12 },
        data_retention: { type: String, default: '1 Month' },
        isActive: { type: Boolean, default: true },
        features: [String],
    },
    { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
