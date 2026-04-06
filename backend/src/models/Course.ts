import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  courseHours: number;
  syllabus: string[];
  rating: number;
  numRatings: number;
  creditsRequired: number;
  instructor: string;
  level: string;
  commissionPercent: number;
  referralDiscount: number;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price must be a positive number'],
    },
    courseHours: {
      type: Number,
      required: [true, 'Course hours is required'],
      min: [0, 'Course hours must be a positive number'],
    },
    syllabus: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be between 0 and 5'],
      max: [5, 'Rating must be between 0 and 5'],
    },
    numRatings: {
      type: Number,
      default: 0,
      min: [0, 'Number of ratings cannot be negative'],
    },
    creditsRequired: {
      type: Number,
      required: [true, 'Credits required is required'],
      min: [0, 'Credits required must be a positive number'],
    },
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    commissionPercent: {
      type: Number,
      default: 10,
      min: [0, 'Commission cannot be negative'],
      max: [100, 'Commission cannot exceed 100%'],
    },
    referralDiscount: {
      type: Number,
      default: 20,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICourse>('Course', CourseSchema);
