import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvitation extends Document {
    email: string;
    company_id: Types.ObjectId;
    role: 'admin' | 'sub_admin' | 'user' | 'employee';
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    expiresAt: Date;
}

const InvitationSchema = new Schema<IInvitation>({
    email: { type: String, required: true, trim: true, lowercase: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    role: { type: String, enum: ['admin', 'sub_admin', 'user', 'employee'], default: 'user' },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

InvitationSchema.index({ company_id: 1, email: 1 }, { unique: true });
InvitationSchema.index({ token: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
