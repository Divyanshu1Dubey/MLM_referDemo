import express from 'express';
import { getDashboardStats, getEarningsHistory, getTransactionHistory, getLeaderboard } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/stats', authMiddleware, getDashboardStats);
router.get('/earnings', authMiddleware, getEarningsHistory);
router.get('/transactions', authMiddleware, getTransactionHistory);
router.get('/leaderboard', getLeaderboard);

export default router;
