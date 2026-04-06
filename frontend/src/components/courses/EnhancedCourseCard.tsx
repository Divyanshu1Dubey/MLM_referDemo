'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  instructor?: string;
  level?: string;
  rating?: number;
  numRatings?: number;
  courseHours?: number;
  referralDiscount?: number;
  commissionPercent?: number;
}

interface EnhancedCourseCardProps {
  course: Course;
  isPurchased?: boolean;
  index?: number;
  showDiscount?: boolean;
}

export default function EnhancedCourseCard({ 
  course, 
  isPurchased = false,
  index = 0,
  showDiscount = false
}: EnhancedCourseCardProps) {
  const router = useRouter();
  const discountPercent = course.referralDiscount || 10;
  const discountedPrice = showDiscount ? Math.round(course.price * (1 - discountPercent / 100)) : course.price;

  const handleClick = () => {
    router.push(`/courses/${course._id}`);
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getLevelColor = (level: string = 'Beginner') => {
    const colors = {
      Beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      Advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[level as keyof typeof colors] || colors.Beginner;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      onClick={handleClick}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer border border-gray-100 dark:border-gray-700"
    >
      {/* Course Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        
        {/* Badge Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {showDiscount && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg"
            >
              🎁 {discountPercent}% OFF
            </motion.span>
          )}
          {isPurchased && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg"
            >
              ✓ Purchased
            </motion.span>
          )}
          {course.level && (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getLevelColor(course.level)}`}>
              {course.level}
            </span>
          )}
        </div>

        {/* Commission badge */}
        {course.commissionPercent && course.commissionPercent > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full shadow-lg">
              💰 Earn {course.commissionPercent}%
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4"
        >
          <span className="text-white text-sm font-medium">
            Click to view details →
          </span>
        </motion.div>
      </div>

      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        {course.instructor && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {course.instructor}
          </p>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Rating & Duration */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {renderStars(course.rating || 0)}
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {course.rating?.toFixed(1) || '0.0'}
            </span>
            {course.numRatings && course.numRatings > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                ({course.numRatings})
              </span>
            )}
          </div>
          {course.courseHours && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.courseHours}h
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            {showDiscount ? (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400 line-through">₹{course.price}</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{discountedPrice}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₹{course.price}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
              isPurchased
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                : showDiscount
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isPurchased ? 'View Course' : showDiscount ? 'Claim Discount' : 'Enroll Now'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
