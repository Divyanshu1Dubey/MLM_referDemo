# 🚀 Quick Start Guide

Get the Course Store referral system up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account

## Setup Steps

### 1. Install Dependencies

```bash
npm install
npm run install:all
```

### 2. Configure Environment

**Backend (`backend/.env`):** (Already configured!)
```env
MONGO_URI=mongodb+srv://div_2712:Kali2712%40@cluster0.dw5dijy.mongodb.net/course-store?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here_12345
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend (`frontend/.env.local`):** (Already configured!)
```env
NEXTAUTH_SECRET=your_super_secret_nextauth_key_here_12345
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

This creates:
- **23 premium courses** (C1, C2, C3 + 20 more)
- **Admin user**: admin@coursestore.com / admin123
- **Demo user**: demo@coursestore.com / demo123 (Referral Code: DEMO2024)

### 4. Start Servers

**From root directory:**
```bash
npm run dev
```

**Or start individually:**

Terminal 1:
```bash
cd backend && npm run dev
```

Terminal 2:
```bash
cd frontend && npm run dev
```

### 5. Test the Referral System

**Demo Flow:**
1. Open http://localhost:3000
2. Click on a course to view details
3. Notice the "Earn X% commission" badge

**Test Referral Link:**
1. Visit: http://localhost:3000?ref=DEMO2024
2. Notice the "You've been invited!" banner
3. Courses show 10% discount badge
4. Register through this link
5. Purchase a course (discounted!)
6. Login as demo@coursestore.com to see commission earned

**Test Dashboard:**
1. Login with demo@coursestore.com / demo123
2. Go to Dashboard
3. Copy your referral link
4. Share on WhatsApp (button available)
5. Track referrals and earnings

## Account Credentials

| Role | Email | Password | Referral Code |
|------|-------|----------|---------------|
| Admin | admin@coursestore.com | admin123 | - |
| Demo User | demo@coursestore.com | demo123 | DEMO2024 |

## Key Features

### 🎯 Referral System
- Unique referral code per user
- 10% commission on referred purchases
- 10% discount for referred users
- WhatsApp share integration
- Track referrals and conversions

### 💰 Earnings & Wallet
- Commission tracking
- Pending → Cleared (7 days) → Withdrawn flow
- Withdrawal requests to UPI/Bank
- Transaction history

### 👥 Admin Panel
- User management
- Course management
- Commission settings
- Withdrawal approvals
- Analytics dashboard

## Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB Atlas is accessible
- Check if password is URL-encoded (@ = %40)

**Port Already in Use:**
- Change `PORT` in backend/.env (default: 5000)
- Change port in frontend/.env.local's `NEXT_PUBLIC_API_URL`

**CORS Errors:**
- Verify `FRONTEND_URL` in backend/.env matches your frontend URL

## Need Help?

Check the main [README.md](./README.md) for comprehensive documentation.
