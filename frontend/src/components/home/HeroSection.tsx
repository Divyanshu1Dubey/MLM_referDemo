'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface HeroSectionProps {
  referralCode?: string | null;
}

export default function HeroSection({ referralCode }: HeroSectionProps) {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 py-20 px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full"
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            {/* Referral Badge */}
            {referralCode ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/30 backdrop-blur-sm rounded-full mb-6 border border-green-400/50"
              >
                <span className="text-2xl">🎁</span>
                <span className="text-sm font-bold text-green-200">You've been invited! Get 10% OFF</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">🎉 Join 10,000+ students learning today</span>
              </motion.div>
            )}

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              {referralCode ? (
                <>
                  Your Friend
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">
                    Invited You!
                  </span>
                </>
              ) : (
                <>
                  Learn Without
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                    Limits
                  </span>
                </>
              )}
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              {referralCode 
                ? "Claim your exclusive 10% discount on your first course. Plus, start earning by referring others!"
                : "Master new skills with world-class courses. Earn money by referring friends and unlock unlimited earning potential!"}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {referralCode ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/register?r=${referralCode}`)}
                    className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-green-600 transition-all"
                  >
                    🎁 Claim 10% Discount
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/#courses')}
                    className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                  >
                    Browse Courses
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/#courses')}
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    Explore Courses
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/register')}
                    className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                  >
                    Start Earning Today
                  </motion.button>
                </>
              )}
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '📚', text: '20+ Premium Courses' },
                { icon: '💰', text: '10% Commission' },
                { icon: '🎁', text: '10% Referral Discount' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 text-blue-100"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Illustration/Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            {/* Floating Cards */}
            <div className="relative h-96">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 right-0 w-64 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">💰</span>
                  </div>
                  <div>
                    <div className="text-white font-bold">+₹499</div>
                    <div className="text-xs text-blue-200">Commission earned</div>
                  </div>
                </div>
                <div className="text-xs text-blue-200">From referral: Rahul M.</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute bottom-0 left-0 w-64 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">👥</span>
                  </div>
                  <div>
                    <div className="text-white font-bold">12 Referrals</div>
                    <div className="text-xs text-blue-200">This month</div>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
                <div className="text-xs text-blue-200 mt-1">75% to Gold tier!</div>
              </motion.div>

              {/* Center Achievement Badge */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
              >
                <div className="text-center">
                  <span className="text-4xl">🏆</span>
                  <div className="text-xs font-bold text-white mt-1">Top Earner</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-24"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7L1200,53L1200,120L1152,120C1104,120,1008,120,912,120C816,120,720,120,624,120C528,120,432,120,336,120C240,120,144,120,48,120L0,120Z"
            className="fill-blue-50 dark:fill-gray-900"
          />
        </svg>
      </div>
    </section>
  );
}
