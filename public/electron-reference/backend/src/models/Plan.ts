import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
    name: string;
    price_monthly: number;
    max_users: number; 
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
