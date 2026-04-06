import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Earning from '../models/Earning';
import Withdrawal from '../models/Withdrawal';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

export const getWalletBalance = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Calculate available balance (cleared earnings)
    const clearedEarnings = await Earning.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'cleared' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingEarnings = await Earning.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['pending', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const availableBalance = (clearedEarnings[0]?.total || 0) - (pendingWithdrawals[0]?.total || 0);

    res.status(200).json({
      success: true,
      data: {
        walletBalance: user.walletBalance || 0,
        availableBalance: Math.max(0, availableBalance),
        pendingEarnings: pendingEarnings[0]?.total || 0,
        clearedEarnings: clearedEarnings[0]?.total || 0,
        totalEarnings: user.totalEarnings || 0,
        pendingWithdrawals: pendingWithdrawals[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { amount, paymentMethod, bankDetails, upiId } = req.body;

    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!amount || amount < 100) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ error: 'Minimum withdrawal amount is ₹100' });
      return;
    }

    if (!paymentMethod || !['bank', 'upi'].includes(paymentMethod)) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ error: 'Invalid payment method' });
      return;
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate available balance
    const clearedEarnings = await Earning.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'cleared' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).session(session);

    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['pending', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).session(session);

    const availableBalance = (clearedEarnings[0]?.total || 0) - (pendingWithdrawals[0]?.total || 0);

    if (amount > availableBalance) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ 
        error: 'Insufficient balance',
        availableBalance,
        requestedAmount: amount,
      });
      return;
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      amount,
      paymentMethod,
      bankDetails: paymentMethod === 'bank' ? bankDetails : undefined,
      upiId: paymentMethod === 'upi' ? upiId : undefined,
    });
    await withdrawal.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawal,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Request withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
};

export const getWithdrawalHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const query: any = { userId };
    if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status as string)) {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Withdrawal.countDocuments(query);

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
    console.error('Get withdrawal history error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
};

// Auto-clear earnings after 7 days (can be called by a cron job)
export const clearPendingEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await Earning.updateMany(
      {
        status: 'pending',
        createdAt: { $lte: sevenDaysAgo },
      },
      {
        $set: { status: 'cleared', clearedAt: new Date() },
      }
    );

    res.status(200).json({
      success: true,
      message: `Cleared ${result.modifiedCount} earnings`,
    });
  } catch (error) {
    console.error('Clear pending earnings error:', error);
    res.status(500).json({ error: 'Failed to clear pending earnings' });
  }
};
