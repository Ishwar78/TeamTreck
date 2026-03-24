import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomRole extends Document {
  company_id: Types.ObjectId;
  name: string;
  permissions: {
    [module: string]: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomRoleSchema = new Schema<ICustomRole>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const CustomRole = mongoose.model<ICustomRole>('CustomRole', CustomRoleSchema);
