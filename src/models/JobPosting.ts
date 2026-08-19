import mongoose, { Schema, type Document } from "mongoose";

export interface IJobPosting extends Document {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  tagline: string;
  experience: string;
  description: any;
  profileSections: any;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true },
    location: { type: String, default: "Remote" },
    employmentType: { type: String, default: "Full-time" },
    tagline: { type: String, default: "" },
    experience: { type: String, default: "2+ years" },
    description: { type: Schema.Types.Mixed, default: [] },
    profileSections: { type: Schema.Types.Mixed, default: [] },
    published: { type: Boolean, default: true },
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

JobPostingSchema.index({ published: 1, createdAt: -1 });

export const JobPosting = mongoose.models.JobPosting || mongoose.model<IJobPosting>("JobPosting", JobPostingSchema);
