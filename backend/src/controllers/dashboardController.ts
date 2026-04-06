import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Course from '../models/Course';
import Purchase from '../models/Purchase';
import Earning from '../models/Earning';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

export const purchaseCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id: courseId } = req.params;
    const { applyReferralDiscount, referralCode } = req.body;
    const requestedReferralCode =
      typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : '';
    const userId = req.userId;

    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if course exists
    const course = await Course.findById(courseId).session(session);
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check if user has already purchased this course
    const existingPurchase = await Purchase.findOne({ userId, courseId }).session(session);
    if (existingPurchase) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ error: 'Course already purchased' });
      return;
    }

    // Find the user with session for transactional consistency
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Allow users to apply a referral code directly at purchase time (before first conversion).
    if (requestedReferralCode) {
      if (user.hasConverted) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
          error: 'Referral code can only be applied before your first purchase',
        });
        return;
      }

      if (user.referralCode === requestedReferralCode) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: 'You cannot use your own referral code' });
        return;
      }

      const referrer = await User.findOne({ referralCode: requestedReferralCode }).session(
        session
      );

      if (!referrer) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: 'Invalid referral code' });
        return;
      }

      const referrerId = referrer._id as mongoose.Types.ObjectId;

      if (referrerId.toString() === userId.toString()) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: 'You cannot use your own referral code' });
        return;
      }

      if (user.referredBy && user.referredBy.toString() !== referrerId.toString()) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: 'A different referral has already been applied' });
        return;
      }

      if (!user.referredBy) {
        user.referredBy = referrerId;
      }
    }

    // Calculate discount if user was referred and wants to apply it
    let finalPrice = course.price;
    let discount = 0;
    const shouldApplyReferralDiscount =
      Boolean(applyReferralDiscount) || Boolean(requestedReferralCode);

    if (shouldApplyReferralDiscount && user.referredBy && !user.hasConverted) {
      discount = (course.price * (course.referralDiscount || 10)) / 100;
      finalPrice = course.price - discount;
    }

    // Create purchase record
    const purchase = new Purchase({
      userId,
      courseId,
      price: finalPrice,
    });
    await purchase.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'purchase',
      amount: finalPrice,
      status: 'completed',
      courseId,
      courseName: course.title,
      paymentMethod: 'mock_payment',
      paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      discount,
      discountType: discount > 0 ? 'referral' : undefined,
      originalAmount: course.price,
      referrerId: user.referredBy,
      description: `Purchased course: ${course.title}`,
    });
    await transaction.save({ session });

    let referrerCredited = false;
    let commissionAmount = 0;

    // Check if user has already converted (first purchase logic)
    if (!user.hasConverted) {
      // Mark user as converted and add credits
      user.hasConverted = true;
      user.credits += 2;

      // If user was referred, credit the referrer with commission
      if (user.referredBy) {
        const referrer = await User.findById(user.referredBy).session(session);

        if (referrer) {
          // Check if this referral has already been credited
          const alreadyCredited = referrer.creditedReferrals.some(
            (id) => id.toString() === userId.toString()
          );

          if (!alreadyCredited) {
            // Calculate commission based on course price
            commissionAmount = (finalPrice * (course.commissionPercent || 10)) / 100;

            // Update referrer's earnings
            referrer.credits += 2;
            referrer.pendingEarnings += commissionAmount;
            referrer.totalEarnings += commissionAmount;
            referrer.creditedReferrals.push(new mongoose.Types.ObjectId(userId));
            await referrer.save({ session });

            // Create earning record for referrer
            const earning = new Earning({
              userId: referrer._id,
              amount: commissionAmount,
              type: 'referral_commission',
              sourceUserId: userId,
              courseId,
              courseName: course.title,
              status: 'pending',
              description: `Commission from ${user.username}'s purchase of ${course.title}`,
            });
            await earning.save({ session });

            referrerCredited = true;
          }
        }
      }
    }

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Course purchased successfully!',
      creditsEarned: user.hasConverted ? 0 : 2,
      userCredits: user.credits,
      referrerCredited,
      commissionPaid: commissionAmount,
      discount,
      finalPrice,
      transactionId: transaction._id,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Course already purchased' });
      return;
    }
    
    console.error('Purchase course error:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
};

export const purchaseWithCredits = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id: courseId } = req.params;
    const userId = req.userId;

    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if course exists
    const course = await Course.findById(courseId).session(session);
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check if user has already purchased this course
    const existingPurchase = await Purchase.findOne({ userId, courseId }).session(session);
    if (existingPurchase) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ error: 'Course already purchased' });
      return;
    }

    // Find the user
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user has enough credits
    if (user.credits < course.creditsRequired) {
      const creditsNeeded = course.creditsRequired - user.credits;
      // Each referral gives 2 credits (when they make first purchase)
      const referralsNeeded = Math.ceil(creditsNeeded / 2);
      
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        error: 'Insufficient credits',
        currentCredits: user.credits,
        creditsRequired: course.creditsRequired,
        creditsNeeded,
        referralsNeeded,
        message: `Refer ${referralsNeeded} more user${referralsNeeded > 1 ? 's' : ''} to buy this course`,
      });
      return;
    }

    // Deduct credits from user
    user.credits -= course.creditsRequired;
    await user.save({ session });

    // Create purchase record with price as 0 (paid with credits)
    const purchase = new Purchase({
      userId,
      courseId,
      price: 0, // Paid with credits
    });
    await purchase.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Course purchased successfully with credits!',
      remainingCredits: user.credits,
      creditsUsed: course.creditsRequired,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Purchase with credits error:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Count total users referred by this user
    const totalReferredUsers = await User.countDocuments({ referredBy: userId });

    // Count converted users (users who made their first purchase)
    const convertedUsers = await User.countDocuments({
      referredBy: userId,
      hasConverted: true,
    });

    // Get referred users details
    const referredUsers = await User.find({ referredBy: userId })
      .select('username email hasConverted createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get earnings summary
    const earnings = await Earning.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const totalEarnings = await Earning.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingEarnings = await Earning.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const clearedEarnings = await Earning.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'cleared' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Generate referral link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${frontendUrl}?ref=${user.referralCode}`;

    res.status(200).json({
      success: true,
      data: {
        totalReferredUsers,
        convertedUsers,
        totalCreditsEarned: user.credits,
        referralLink,
        referralCode: user.referralCode,
        username: user.username,
        walletBalance: user.walletBalance || 0,
        totalEarnings: totalEarnings[0]?.total || 0,
        pendingEarnings: pendingEarnings[0]?.total || 0,
        clearedEarnings: clearedEarnings[0]?.total || 0,
        recentReferrals: referredUsers,
        recentEarnings: earnings,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getEarningsHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const query: any = { userId };
    if (status && ['pending', 'cleared', 'withdrawn'].includes(status as string)) {
      query.status = status;
    }

    const earnings = await Earning.find(query)
      .populate('sourceUserId', 'username email')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Earning.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        earnings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get earnings history error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings history' });
  }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, type } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const query: any = { userId };
    if (type && ['purchase', 'withdrawal', 'refund'].includes(type as string)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaderboard = await User.find({ totalEarnings: { $gt: 0 } })
      .select('username totalEarnings credits')
      .sort({ totalEarnings: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
