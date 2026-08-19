import mongoose, { Schema, type Document } from "mongoose";

export interface IBlogPost extends Document {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category?: string | null;
  coverImage?: string | null;
  authorName?: string | null;
  authorImage?: string | null;
  published: boolean;
  authorId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: null },
    coverImage: { type: String, default: null },
    authorName: { type: String, default: null },
    authorImage: { type: String, default: null },
    published: { type: Boolean, default: true },
    authorId: { type: String, default: null },
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

BlogPostSchema.index({ createdAt: -1 });

export const BlogPost =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
