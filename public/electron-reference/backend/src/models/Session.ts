import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
  user_id: Types.ObjectId;
  company_id: Types.ObjectId;
  device_id: string;
  start_time: Date;
  end_time?: Date;
  status: 'active' | 'paused' | 'ended' | 'force_ended';
  events: Array<{
    type: 'start' | 'pause' | 'resume' | 'end' | 'force_end' | 'idle_start' | 'idle_end';
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>;
  summary: {
    total_duration: number;
    active_duration: number;
    idle_duration: number;
    pause_duration: number;
    screenshots_count: number;
    activity_score: number;
  };
}

const SessionSchema = new Schema<ISession>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  device_id: { type: String, required: true },
  start_time: { type: Date, required: true, default: Date.now },
  end_time: Date,
  status: { type: String, enum: ['active', 'paused', 'ended', 'force_ended'], default: 'active' },
  events: [{
    type: { type: String, enum: ['start', 'pause', 'resume', 'end', 'force_end', 'idle_start', 'idle_end'], required: true },
    timestamp: { type: Date, required: true },
    metadata: Schema.Types.Mixed,
  }],
  summary: {
    total_duration: { type: Number, default: 0 },
    active_duration: { type: Number, default: 0 },
    idle_duration: { type: Number, default: 0 },
    pause_duration: { type: Number, default: 0 },
    screenshots_count: { type: Number, default: 0 },
    activity_score: { type: Number, default: 0 },
  },
}, { timestamps: true });

SessionSchema.index({ company_id: 1, user_id: 1, start_time: -1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ end_time: 1 }, { expireAfterSeconds: 90 * 86400 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
