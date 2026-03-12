import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITimeClaim extends Document {
    user_id: Types.ObjectId;
    company_id: Types.ObjectId;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    type: 'Meeting' | 'Call' | 'Break' | 'Other';
    reason: string;
    duration: number; // minutes
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
}

const TimeClaimSchema = new Schema<ITimeClaim>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String, enum: ['Meeting', 'Call', 'Break', 'Other'], default: 'Other' },
    reason: { type: String, required: true },
    duration: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
}, { timestamps: true });

export const TimeClaim = mongoose.model<ITimeClaim>('TimeClaim', TimeClaimSchema);
