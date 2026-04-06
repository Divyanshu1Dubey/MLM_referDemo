import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'purchase' | 'withdrawal' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'processing';
  courseId?: mongoose.Types.ObjectId;
  courseName?: string;
  paymentMethod?: string;
  paymentId?: string;
  withdrawalDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  discount?: number;
  discountType?: 'referral' | 'promo';
  originalAmount?: number;
  referrerId?: mongoose.Types.ObjectId;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'withdrawal', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'processing'],
      default: 'pending',
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    courseName: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    withdrawalDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['referral', 'promo'],
    },
    originalAmount: {
      type: Number,
    },
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
