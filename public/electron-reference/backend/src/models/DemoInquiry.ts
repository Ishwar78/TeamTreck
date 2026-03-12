import mongoose, { Schema, Document } from "mongoose";

export interface IDemoInquiry extends Document {
  name: string;
  email: string;
  phone: string;
  organisation?: string;
  message?: string;
  createdAt: Date;
}

const DemoInquirySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    organisation: { type: String },
    message: { type: String },
  },
  { timestamps: true }
);

export const DemoInquiry = mongoose.model<IDemoInquiry>(
  "DemoInquiry",
  DemoInquirySchema
);