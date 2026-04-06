import mongoose, { Document, Schema } from 'mongoose';

export interface IEarning extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'referral_commission' | 'bonus' | 'milestone';
  sourceUserId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  courseName?: string;
  status: 'pending' | 'cleared' | 'withdrawn';
  description: string;
  clearedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const earningSchema = new Schema<IEarning>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['referral_commission', 'bonus', 'milestone'],
      required: true,
    },
    sourceUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    courseName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'withdrawn'],
      default: 'pending',
    },
    description: {
      type: String,
      required: true,
    },
    clearedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
earningSchema.index({ userId: 1, status: 1 });
earningSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IEarning>('Earning', earningSchema);
