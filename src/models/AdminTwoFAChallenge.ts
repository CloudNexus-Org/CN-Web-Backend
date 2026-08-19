import mongoose, { Schema, type Document } from "mongoose";

export interface IAdminTwoFAChallenge extends Document {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  consumedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AdminTwoFAChallengeSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
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

AdminTwoFAChallengeSchema.index({ userId: 1, expiresAt: 1 });

export const AdminTwoFAChallenge =
  mongoose.models.AdminTwoFAChallenge ||
  mongoose.model<IAdminTwoFAChallenge>("AdminTwoFAChallenge", AdminTwoFAChallengeSchema);
