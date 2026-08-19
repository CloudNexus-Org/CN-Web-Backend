import mongoose, { Schema, type Document } from "mongoose";

export interface IContactInquiry extends Document {
  id: string;
  fullName: string;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  interestedIn: string;
  estimatedBudget?: string | null;
  heardFrom?: string | null;
  projectDetails: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactInquirySchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    companyName: { type: String, default: null },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    interestedIn: { type: String, required: true },
    estimatedBudget: { type: String, default: null },
    heardFrom: { type: String, default: null },
    projectDetails: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

ContactInquirySchema.index({ createdAt: -1 });

export const ContactInquiry =
  mongoose.models.ContactInquiry ||
  mongoose.model<IContactInquiry>("ContactInquiry", ContactInquirySchema);
