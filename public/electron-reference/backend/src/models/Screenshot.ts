import mongoose, { Schema, Document } from 'mongoose';

export interface IScreenshot extends Document {
  user_id: mongoose.Types.ObjectId;
  company_id: mongoose.Types.ObjectId;
  session_id: mongoose.Types.ObjectId;
  timestamp: Date;
  s3_key: string;
  s3_bucket: string;
  file_size: number;
  blurred: boolean;
}

const ScreenshotSchema = new Schema<IScreenshot>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    session_id: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    timestamp: { type: Date, default: Date.now },
    s3_key: { type: String, required: true },
    s3_bucket: { type: String, default: 'local' },
    file_size: Number,
    blurred: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Screenshot = mongoose.model<IScreenshot>(
  'Screenshot',
  ScreenshotSchema
);
