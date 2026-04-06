'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import EnhancedCourseCard from '@/components/courses/EnhancedCourseCard';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import SocialProofNotifications from '@/components/home/SocialProofNotifications';
import Notification from '@/components/ui/Notification';
import { coursesAPI, apiClient } from '@/lib/api';
import { useLoadingStore } from '@/store/useStore';

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  commissionPercent?: number;
  referralDiscount?: number;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [referredCourse, setReferredCourse] = useState<Course | null>(null);
  const { isLoading, setLoading } = useLoadingStore();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');
  const courseId = searchParams.get('course');

  // Store referral code and course in localStorage (course-specific referral)
  useEffect(() => {
    if (referralCode) {
      localStorage.setItem('referralCode', referralCode);
      if (courseId) {
        localStorage.setItem('referredCourseId', courseId);
      }
    }
  }, [referralCode, courseId]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPurchasedCourses();
    }
  }, [status]);

  // Find the referred course if courseId is present
  useEffect(() => {
    if (courseId && courses.length > 0) {
      const course = courses.find(c => c._id === courseId);
      if (course) {
        setReferredCourse(course);
      }
    }
  }, [courseId, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      const coursesData = response.data || [];
      
      if (Array.isArray(coursesData)) {
        setCourses(coursesData);
      } else {
        setCourses([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedCourses = async () => {
    try {
      const response = await apiClient.get('/api/user/check-purchased', {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      setPurchasedCourseIds(response.data.purchasedCourseIds || []);
    } catch (error) {
      console.error('Failed to fetch purchased courses:', error);
    }
  };

  return (
    <>
      <Notification />
      {!session && <SocialProofNotifications />}
      
      {/* Course-Specific Referral Banner */}
      {referralCode && referredCourse && !session && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-6 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                  <span className="text-4xl">🎁</span>
                </div>
                <div className="text-white">
                  <h3 className="font-bold text-xl">You've been invited!</h3>
                  <p className="text-lg text-purple-100">
                    Get <span className="font-bold text-yellow-300">{referredCourse.referralDiscount || 20}% OFF</span> on 
                    <span className="font-bold"> "{referredCourse.title}"</span>
                  </p>
                  <p className="text-sm text-purple-200 mt-1">
                    Original: ₹{referredCourse.price.toLocaleString()} → 
                    <span className="font-bold text-green-300"> ₹{Math.round(referredCourse.price * (1 - (referredCourse.referralDiscount || 20) / 100)).toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <Link 
                href={`/courses/${referredCourse._id}?ref=${referralCode}`}
                className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-purple-50 transition-colors shadow-lg text-lg"
              >
                Claim Discount →
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generic Referral Banner - Show when there's a referral code but no specific course */}
      {referralCode && !referredCourse && !session && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 py-4 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div className="text-white">
                <h3 className="font-bold text-lg">You've been invited!</h3>
                <p className="text-green-100 text-sm">Get 20% OFF your first course purchase</p>
              </div>
            </div>
            <Link 
              href={`/register?r=${referralCode}`}
              className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-green-50 transition-colors shadow-lg"
            >
              Claim Your Discount →
            </Link>
          </div>
        </motion.div>
      )}
      
      {/* Show Hero and Stats only for non-logged-in users */}
      {!session && (
        <>
          <HeroSection referralCode={referralCode} />
          <StatsSection />
          
          {/* Referral Benefits Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                  Share & Earn with Referrals 💰
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Join our referral program and earn money every time someone purchases using your link
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔗</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get Your Link</h3>
                  <p className="text-gray-600 dark:text-gray-400">Sign up and get your unique referral link for each course</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">👥</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Share with Friends</h3>
                  <p className="text-gray-600 dark:text-gray-400">They get 20% OFF on that specific course</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Earn Commission</h3>
                  <p className="text-gray-600 dark:text-gray-400">Get up to 20% commission on every successful referral</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-center mt-10"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Start Earning Today
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="bg-white dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                  What Our Students Say
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: 'Rahul M.', course: 'Web Development', text: 'Amazing course! I landed a job within 3 months of completing it.' },
                  { name: 'Priya S.', course: 'Digital Marketing', text: 'The referral program is fantastic. I earned ₹15,000 last month!' },
                  { name: 'Amit K.', course: 'Data Science', text: 'Best investment in my career. The content is top-notch.' },
                ].map((testimonial, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">"{testimonial.text}"</p>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.course}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Personalized Welcome for Logged-in Users */}
      {session && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white"
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
                Welcome back, {(session as any)?.user?.name || 'Learner'}! 👋
              </h1>
              <p className="text-lg text-indigo-100">
                Continue your learning journey and discover new courses
              </p>
            </motion.div>
            <Link 
              href="/dashboard"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      )}
      
      {/* Course Section */}
      <div className="bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          {/* Featured Course for Referral (Course-Specific) */}
          {referralCode && referredCourse && !session && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎯</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Friend Recommended This Course!
                </h2>
                <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full ml-2">
                  {referredCourse.referralDiscount || 20}% OFF
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Get an exclusive discount on this specific course. Sign up now to claim your savings!
              </p>
              <div className="max-w-md">
                <EnhancedCourseCard
                  course={referredCourse}
                  isPurchased={false}
                  index={0}
                  showDiscount={true}
                />
              </div>
            </motion.div>
          )}

          {/* General Referral Courses (Non-specific) */}
          {referralCode && !referredCourse && !session && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎁</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Special Offer: 20% OFF These Courses!
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your friend referred you! Sign up now to claim your discount.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.slice(0, 3).map((course, index) => (
                  <EnhancedCourseCard
                    key={course._id}
                    course={course}
                    isPurchased={false}
                    index={index}
                    showDiscount={true}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommended Courses for Logged-in Users */}
          {session && purchasedCourseIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                Because you bought...
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Students who purchased your courses also enjoyed these
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {courses
                  .filter(c => !purchasedCourseIds.includes(c._id))
                  .slice(0, 3)
                  .map((course, index) => (
                    <EnhancedCourseCard
                      key={course._id}
                      course={course}
                      isPurchased={false}
                      index={index}
                    />
                  ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            id="courses"
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Explore Our Courses
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose from our wide range of courses and start learning today
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4" />
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {courses.map((course, index) => (
                <EnhancedCourseCard 
                  key={course._id} 
                  course={course}
                  isPurchased={purchasedCourseIds.includes(course._id)}
                  index={index}
                />
              ))}
            </div>
          )}

          {!isLoading && courses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">No courses available at the moment.</p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
