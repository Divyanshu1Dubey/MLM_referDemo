import express from 'express';
import { 
  isAdmin,
  getAdminDashboard,
  getAllUsers,
  updateUserRole,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseCommission,
  getPendingWithdrawals,
  processWithdrawal,
  getReferralStats,
  getAllTransactions
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(isAdmin as any);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);

// Course Management
router.post('/courses', createCourse);
router.put('/courses/:courseId', updateCourse);
router.delete('/courses/:courseId', deleteCourse);
router.put('/courses/:courseId/commission', updateCourseCommission);

// Withdrawal Management
router.get('/withdrawals', getPendingWithdrawals);
router.put('/withdrawals/:withdrawalId', processWithdrawal);

// Referral Tracking
router.get('/referrals', getReferralStats);

// Transactions
router.get('/transactions', getAllTransactions);

export default router;
