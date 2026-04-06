'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { coursesAPI, setAuthToken, userAPI, apiClient } from '@/lib/api';
import { useNotificationStore } from '@/store/useStore';
import Notification from '@/components/ui/Notification';

interface Course {
  _id: string;
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
  referralDiscount?: number;
  commissionPercent?: number;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchasingWithCredits, setPurchasingWithCredits] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [userReferralCode, setUserReferralCode] = useState('');
  const [hasValidReferral, setHasValidReferral] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [appliedReferralCode, setAppliedReferralCode] = useState('');
  const { showNotification } = useNotificationStore();

  const normalizeReferralCode = (code: string | null) => (code || '').trim().toUpperCase();

  // Check for course-specific referral (discount only applies to THIS course)
  useEffect(() => {
    const referralCodeFromQuery = normalizeReferralCode(searchParams.get('ref'));
    const referralCodeFromStorage = normalizeReferralCode(localStorage.getItem('referralCode'));
    const referralCode = referralCodeFromQuery || referralCodeFromStorage;
    const referredCourseId = searchParams.get('course') || localStorage.getItem('referredCourseId');
    
    // Store in localStorage if coming from URL
    if (referralCodeFromQuery) {
      localStorage.setItem('referralCode', referralCodeFromQuery);
    }
    if (searchParams.get('course')) {
      localStorage.setItem('referredCourseId', searchParams.get('course')!);
    }
    
    // Discount is valid ONLY if:
    // 1. There's a referral code AND
    // 2. Either: no specific course was set (generic referral) OR the course matches this page
    if (referralCode && (!referredCourseId || referredCourseId === params.id)) {
      setHasValidReferral(true);
      setAppliedReferralCode(referralCode);
      setReferralCodeInput(referralCode);
      return;
    }

    setHasValidReferral(false);
    setAppliedReferralCode('');
  }, [searchParams, params.id]);

  useEffect(() => {
    if (params.id) {
      fetchCourseDetails();
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'authenticated' && course) {
      checkPurchaseStatus();
      fetchUserCredits();
      fetchUserReferralCode();
    }
  }, [status, course]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getById(params.id as string);
      setCourse(response.data || null);
    } catch (error: any) {
      showNotification(
        error.response?.data?.error || 'Failed to load course details',
        'error'
      );
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    try {
      const token = (session as any)?.accessToken;
      if (!token) return;

      const response = await apiClient.get('/api/user/check-purchased', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const purchasedIds = response.data.purchasedCourseIds || [];
      setIsPurchased(purchasedIds.includes(params.id));
    } catch (error) {
      console.error('Failed to check purchase status:', error);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const token = (session as any)?.accessToken;
      if (!token) return;

      setAuthToken(token);
      const response = await userAPI.getProfile();
      setUserCredits(response.user?.credits || 0);
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  const fetchUserReferralCode = async () => {
    try {
      const token = (session as any)?.accessToken;
      if (!token) return;

      setAuthToken(token);
      const response = await userAPI.getProfile();
      setUserReferralCode(response.user?.referralCode || '');
    } catch (error) {
      console.error('Failed to fetch referral code:', error);
    }
  };

  const clearAppliedReferral = () => {
    localStorage.removeItem('referralCode');
    localStorage.removeItem('referredCourseId');
    setHasValidReferral(false);
    setAppliedReferralCode('');
    setReferralCodeInput('');
  };

  const handleApplyReferralCode = () => {
    const normalizedCode = normalizeReferralCode(referralCodeInput);

    if (!normalizedCode) {
      showNotification('Please enter a referral code', 'error');
      return;
    }

    if (userReferralCode && normalizedCode === normalizeReferralCode(userReferralCode)) {
      showNotification('You cannot use your own referral code', 'error');
      return;
    }

    setReferralCodeInput(normalizedCode);
    setAppliedReferralCode(normalizedCode);
    setHasValidReferral(true);
    localStorage.setItem('referralCode', normalizedCode);
    if (course?._id) {
      localStorage.setItem('referredCourseId', course._id);
    }

    showNotification(
      `Referral code ${normalizedCode} applied. Discount will be verified at purchase.`,
      'success'
    );
  };

  const handlePurchaseWithMoney = async () => {
    if (!session) {
      showNotification('Please login to purchase courses', 'error');
      router.push('/login');
      return;
    }

    try {
      setPurchasing(true);
      const token = (session as any).accessToken;
      setAuthToken(token);

      const response = await coursesAPI.purchase(course!._id, {
        applyReferralDiscount: hasValidReferral,
        referralCode: hasValidReferral ? appliedReferralCode : undefined,
      });

      showNotification(
        response.creditsEarned > 0
          ? `Success! You earned ${response.creditsEarned} credits!`
          : 'Course purchased successfully!',
        'success'
      );

      // Clear the referral data after purchase
      clearAppliedReferral();

      setIsPurchased(true);
      fetchUserCredits();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to purchase course';

      if (
        [
          'Invalid referral code',
          'You cannot use your own referral code',
          'A different referral has already been applied',
          'Referral code can only be applied before your first purchase',
        ].includes(errorMessage)
      ) {
        clearAppliedReferral();
      }

      showNotification(
        errorMessage,
        'error'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseWithCredits = async () => {
    if (!session) {
      showNotification('Please login to purchase courses', 'error');
      router.push('/login');
      return;
    }

    try {
      setPurchasingWithCredits(true);
      const token = (session as any).accessToken;
      setAuthToken(token);

      const response = await coursesAPI.purchaseWithCredits(course!._id);

      showNotification(response.message || 'Course purchased successfully!', 'success');
      setIsPurchased(true);
      fetchUserCredits();
    } catch (error: any) {
      if (error.response?.data?.referralsNeeded) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification(
          error.response?.data?.error || 'Failed to purchase course',
          'error'
        );
      }
    } finally {
      setPurchasingWithCredits(false);
    }
  };

  // Generate course-specific referral link
  const getCourseReferralLink = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?ref=${userReferralCode}&course=${course?._id}`;
  };

  const copyReferralLink = () => {
    const link = getCourseReferralLink();
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    showNotification('Referral link copied!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const link = getCourseReferralLink();
    const text = `🎓 Check out this amazing course: "${course?.title}"!\n\n🎁 Use my referral link to get ${course?.referralDiscount || 20}% OFF!\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
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
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          ({course?.numRatings} ratings)
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Notification />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 animate-pulse">
              <div className="h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4" />
              <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6 sm:mb-8 w-1/2" />
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Notification />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4 transition-colors">
          <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Course not available</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We could not load this course right now.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to courses
            </button>
          </div>
        </div>
      </>
    );
  }

  const creditsNeeded = course.creditsRequired - userCredits;
  const referralsNeeded = Math.ceil(creditsNeeded / 2);

  return (
    <>
      <Notification />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-8 sm:py-12 text-white">
                <button
                  onClick={() => router.push('/')}
                  className="mb-4 flex items-center text-white/80 hover:text-white transition-colors text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Courses
                </button>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3">{course.title}</h1>
                <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-3 sm:mb-4">{course.description}</p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base md:text-lg">{course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base md:text-lg">{course.courseHours} hours</span>
                  </div>
                  <div className="px-3 sm:px-4 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium">
                    {course.level}
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-4 sm:py-6 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>{renderStars(course.rating)}</div>
                <div className="text-right">
                  {hasValidReferral && !isPurchased && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-400 line-through">₹{course.price}</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        🎁 {course.referralDiscount || 20}% OFF
                      </span>
                    </div>
                  )}
                  <div className={`text-2xl sm:text-3xl font-bold ${hasValidReferral && !isPurchased ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    ₹{hasValidReferral && !isPurchased ? Math.round(course.price * (1 - (course.referralDiscount || 20) / 100)) : course.price}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* Syllabus Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 mr-3 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    Course Syllabus
                  </h2>
                  <ul className="space-y-3">
                    {course.syllabus.map((topic, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                        className="flex items-start gap-3 text-sm sm:text-base text-gray-700 dark:text-gray-300"
                      >
                        <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="pt-1">{topic}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Share This Course Section - For logged-in users */}
                {session && userReferralCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl shadow-lg p-6 sm:p-8 border-2 border-indigo-200 dark:border-indigo-800"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="text-2xl mr-2">💰</span>
                      Share & Earn {course.commissionPercent || 10}% Commission
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Share this course with friends and earn <span className="font-bold text-green-600">₹{Math.round(course.price * (course.commissionPercent || 10) / 100)}</span> when they purchase using your link!
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your referral link for this course:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={getCourseReferralLink()}
                          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm font-mono truncate"
                        />
                        <button
                          onClick={copyReferralLink}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            linkCopied
                              ? 'bg-green-500 text-white'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {linkCopied ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={shareOnWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Share on WhatsApp
                      </button>
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        🎁 Your friends will get <span className="font-bold">{course.referralDiscount || 20}% OFF</span> on this specific course when they use your link!
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar - Purchase Options */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 lg:sticky lg:top-8"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Purchase Options
                  </h2>

                  {isPurchased ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className="mb-4 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <svg
                          className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-green-700 dark:text-green-400">
                        Already Purchased
                      </p>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                        You have access to this course
                      </p>
                      <button
                        onClick={() => router.push('/my-courses')}
                        className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                      >
                        Go to My Courses
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Referral Code Input */}
                      <div className="border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 bg-indigo-50/40 dark:bg-indigo-900/10">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                          Have a referral code?
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Enter a code like G14PNLSL to unlock referral discount at enrollment.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={referralCodeInput}
                            onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                            placeholder="Enter referral code"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                          />
                          <button
                            onClick={handleApplyReferralCode}
                            disabled={!referralCodeInput.trim()}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              referralCodeInput.trim()
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Apply
                          </button>
                        </div>

                        {hasValidReferral && appliedReferralCode && (
                          <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-green-100 dark:bg-green-900/30 px-3 py-2">
                            <p className="text-xs sm:text-sm text-green-800 dark:text-green-300">
                              Applied code: <span className="font-semibold">{appliedReferralCode}</span>
                            </p>
                            <button
                              onClick={clearAppliedReferral}
                              className="text-xs sm:text-sm text-green-700 dark:text-green-400 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Referral Discount Banner */}
                      {hasValidReferral && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🎁</span>
                            <span className="font-bold text-green-700 dark:text-green-400">Referral Discount Applied!</span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            You're getting {course.referralDiscount || 20}% off as a referred user
                          </p>
                          {appliedReferralCode && (
                            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                              Referral code: {appliedReferralCode}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Money Purchase Option */}
                      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Buy with Money
                        </h3>
                        {hasValidReferral ? (
                          <div className="mb-3 sm:mb-4">
                            <span className="text-lg text-gray-400 line-through">₹{course.price}</span>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                              ₹{Math.round(course.price * (1 - (course.referralDiscount || 20) / 100))}
                            </p>
                          </div>
                        ) : (
                          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3 sm:mb-4">
                            ₹{course.price}
                          </p>
                        )}
                        <button
                          onClick={handlePurchaseWithMoney}
                          disabled={purchasing || !session}
                          className={`w-full py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            purchasing || !session
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : hasValidReferral
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {purchasing ? 'Processing...' : hasValidReferral ? '🎁 Purchase with Discount' : 'Purchase Now'}
                        </button>
                        {!session && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                            Please login to purchase
                          </p>
                        )}
                      </div>

                      {/* Commission Info */}
                      {course.commissionPercent && course.commissionPercent > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">💰</span>
                            <span className="font-bold text-yellow-700 dark:text-yellow-400">Refer & Earn!</span>
                          </div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-300">
                            Earn <span className="font-bold">{course.commissionPercent}% commission</span> (₹{Math.round(course.price * course.commissionPercent / 100)}) when others purchase via your referral
                          </p>
                        </div>
                      )}

                      {/* Credits Purchase Option */}
                      <div className="border-2 border-blue-500 dark:border-blue-600 rounded-lg p-4 sm:p-6 bg-blue-50/50 dark:bg-blue-900/10">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Buy with Credits
                        </h3>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {course.creditsRequired} Credits
                        </p>
                        {session && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                            You have: <span className="font-semibold">{userCredits} credits</span>
                          </p>
                        )}

                        {session && userCredits < course.creditsRequired && (
                          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                              ⚠️ Refer {referralsNeeded} more user{referralsNeeded > 1 ? 's' : ''} to buy this course
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                              You need {creditsNeeded} more credits
                            </p>
                          </div>
                        )}

                        <button
                          onClick={handlePurchaseWithCredits}
                          disabled={
                            purchasingWithCredits ||
                            !session ||
                            userCredits < course.creditsRequired
                          }
                          className={`w-full py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            purchasingWithCredits ||
                            !session ||
                            userCredits < course.creditsRequired
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {purchasingWithCredits
                            ? 'Processing...'
                            : userCredits >= course.creditsRequired
                            ? 'Purchase with Credits'
                            : 'Not Enough Credits'}
                        </button>

                        {!session && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                            Please login to use credits
                          </p>
                        )}

                        {session && (
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full mt-3 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Referral Link
                          </button>
                        )}
                      </div>

                      {/* Info Box */}
                      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          💡 <span className="font-semibold">Earn credits:</span> Share your referral
                          link! You earn 2 credits when someone signs up and makes their first
                          purchase.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
