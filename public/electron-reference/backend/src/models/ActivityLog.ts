import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user_id: Types.ObjectId;
  company_id: Types.ObjectId;
  session_id: Types.ObjectId;
  timestamp: Date;
  interval_start: Date;
  interval_end: Date;
  keyboard_events: number;
  mouse_events: number;
  mouse_distance: number;
  activity_score: number;
  idle: boolean;
  active_window: {
    title: string;
    app_name: string;
    url?: string;
    category?: string;
  };
}

const ActivityLogSchema = new Schema<IActivityLog>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  session_id: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  timestamp: { type: Date, required: true },
  interval_start: { type: Date, required: true },
  interval_end: { type: Date, required: true },
  keyboard_events: { type: Number, default: 0 },
  mouse_events: { type: Number, default: 0 },
  mouse_distance: { type: Number, default: 0 },
  activity_score: { type: Number, default: 0, min: 0, max: 100 },
  idle: { type: Boolean, default: false },
  active_window: {
    title: { type: String, default: '' },
    app_name: { type: String, default: '' },
    url: { type: String, default: '' },
    category: { type: String, default: 'Uncategorized' },
  },
}, { timestamps: false });

ActivityLogSchema.index({ company_id: 1, user_id: 1, timestamp: -1 });
ActivityLogSchema.index({ session_id: 1 });
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 86400 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
