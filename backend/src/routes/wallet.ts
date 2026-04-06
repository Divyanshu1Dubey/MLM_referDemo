import express from 'express';
import { 
  getWalletBalance, 
  requestWithdrawal, 
  getWithdrawalHistory,
  clearPendingEarnings 
} from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/balance', authMiddleware, getWalletBalance);
router.post('/withdraw', authMiddleware, requestWithdrawal);
router.get('/withdrawals', authMiddleware, getWithdrawalHistory);
router.post('/clear-earnings', authMiddleware, clearPendingEarnings);

export default router;
