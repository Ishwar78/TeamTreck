import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyReport extends Document {
  title: string;
  subject: string;
  body: string;
  user_id: mongoose.Types.ObjectId;
  company_id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dailyReportSchema = new Schema<IDailyReport>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

export const DailyReport = mongoose.model<IDailyReport>('DailyReport', dailyReportSchema);
