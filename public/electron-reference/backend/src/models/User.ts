import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  company_id?: Types.ObjectId; // optional for super_admin
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  role: 'super_admin' | 'company_admin' | 'sub_admin' | 'user' | 'employee';
  devices: Array<{
    device_id: string;
    device_name: string;
    os: string;
    bound_at: Date;
    last_seen: Date;
  }>;
  status: 'active' | 'suspended' | 'invited';
  invite_token?: string;
  last_login?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: function (this: IUser) {
        return this.role !== 'super_admin';
      },
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password_hash: {
      type: String,
      required: true,
      select: false,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ['super_admin', 'company_admin', 'sub_admin', 'user', 'employee'],
      default: 'user',
    },

    devices: [
      {
        device_id: { type: String, required: true },
        device_name: String,
        os: String,
        bound_at: { type: Date, default: Date.now },
        last_seen: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'invited',
    },

    invite_token: {
      type: String,
      index: true,
      sparse: true,
    },

    last_login: Date,
  },
  { timestamps: true }
);

/*
  Unique rules:
  - Super admin email must be unique globally
  - Company users must be unique per company
*/

UserSchema.index(
  { company_id: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { role: { $ne: 'super_admin' } },
  }
);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'super_admin' },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
