import mongoose, { Schema, type Document } from "mongoose";

export type JobApplicationStatus = "PENDING" | "APPROVED";

export interface IJobApplication extends Document {
  id: string;
  userId?: string | null;
  jobSlug: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  currentCompany?: string | null;
  ctc?: string | null;
  experience?: string | null;
  resumeFileName?: string | null;
  resumePath?: string | null;
  status: JobApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema: Schema = new Schema(
  {
    userId: { type: String, default: null },
    jobSlug: { type: String, required: true },
    jobTitle: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    currentCompany: { type: String, default: null },
    ctc: { type: String, default: null },
    experience: { type: String, default: null },
    resumeFileName: { type: String, default: null },
    resumePath: { type: String, default: null },
    status: { type: String, enum: ["PENDING", "APPROVED"], default: "PENDING" },
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

JobApplicationSchema.index({ userId: 1 });
JobApplicationSchema.index({ jobSlug: 1 });
JobApplicationSchema.index({ status: 1 });

export const JobApplication =
  mongoose.models.JobApplication ||
  mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);
