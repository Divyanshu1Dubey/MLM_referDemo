import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Course from '../models/Course';
import Purchase from '../models/Purchase';
import Earning from '../models/Earning';
import Transaction from '../models/Transaction';
import Withdrawal from '../models/Withdrawal';
import { AuthRequest } from '../middleware/auth';

// Middleware to check admin role
export const isAdmin = async (req: AuthRequest, res: Response, next: Function): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Dashboard Analytics
export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalPurchases = await Purchase.countDocuments();
    
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'purchase', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCommissions = await Earning.aggregate([
      { $match: { type: 'referral_commission' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });

    // Recent stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const purchasesThisWeek = await Purchase.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Monthly revenue chart data
    const monthlyRevenue = await Transaction.aggregate([
      { $match: { type: 'purchase', status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalPurchases,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCommissions: totalCommissions[0]?.total || 0,
        pendingWithdrawals,
        newUsersThisWeek,
        purchasesThisWeek,
        monthlyRevenue: monthlyRevenue.reverse(),
      },
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard' });
  }
};

// User Management
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Course Management
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseData = req.body;
    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Course with this title already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    const course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;

    // Check if course has any purchases
    const purchaseCount = await Purchase.countDocuments({ courseId });
    if (purchaseCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete course with existing purchases',
        purchaseCount,
      });
      return;
    }

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// Commission Management
export const updateCourseCommission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { commissionPercent, referralDiscount } = req.body;

    const updateData: any = {};
    if (commissionPercent !== undefined) {
      updateData.commissionPercent = commissionPercent;
    }
    if (referralDiscount !== undefined) {
      updateData.referralDiscount = referralDiscount;
    }

    const course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Update course commission error:', error);
    res.status(500).json({ error: 'Failed to update commission' });
  }
};

// Withdrawal Management
export const getPendingWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;

    const withdrawals = await Withdrawal.find({ status })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Withdrawal.countDocuments({ status });

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
};

export const processWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { withdrawalId } = req.params;
    const { action, rejectionReason } = req.body;
    const adminId = req.userId;

    if (!['approve', 'reject', 'complete'].includes(action)) {
      res.status(400).json({ error: 'Invalid action' });
      return;
    }

    const withdrawal = await Withdrawal.findById(withdrawalId).session(session);
    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ error: 'Withdrawal not found' });
      return;
    }

    if (action === 'approve') {
      withdrawal.status = 'approved';
    } else if (action === 'reject') {
      withdrawal.status = 'rejected';
      withdrawal.rejectionReason = rejectionReason;
    } else if (action === 'complete') {
      withdrawal.status = 'completed';
      
      // Update user's wallet and mark earnings as withdrawn
      await Earning.updateMany(
        { userId: withdrawal.userId, status: 'cleared' },
        { $set: { status: 'withdrawn' } }
      ).session(session);

      // Create transaction record
      const transaction = new Transaction({
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: withdrawal.amount,
        status: 'completed',
        paymentMethod: withdrawal.paymentMethod,
        withdrawalDetails: withdrawal.bankDetails || { upiId: withdrawal.upiId },
        description: `Withdrawal of ₹${withdrawal.amount}`,
      });
      await transaction.save({ session });
    }

    withdrawal.processedAt = new Date();
    withdrawal.processedBy = new mongoose.Types.ObjectId(adminId);
    await withdrawal.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Process withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
};

// Referral Tracking
export const getReferralStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const topReferrers = await User.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referredBy',
          as: 'referrals'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          totalReferrals: { $size: '$referrals' },
          convertedReferrals: {
            $size: {
              $filter: {
                input: '$referrals',
                as: 'ref',
                cond: { $eq: ['$$ref.hasConverted', true] }
              }
            }
          },
          totalEarnings: 1,
        }
      },
      { $match: { totalReferrals: { $gt: 0 } } },
      { $sort: { totalReferrals: -1 } },
      { $limit: 20 }
    ]);

    const totalReferrals = await User.countDocuments({ referredBy: { $ne: null } });
    const convertedReferrals = await User.countDocuments({ referredBy: { $ne: null }, hasConverted: true });

    res.status(200).json({
      success: true,
      data: {
        topReferrers,
        totalReferrals,
        convertedReferrals,
        conversionRate: totalReferrals > 0 ? ((convertedReferrals / totalReferrals) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
};

// All Transactions
export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('userId', 'username email')
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
    console.error('Get all transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
