# 🎓 Course Store - Referral & Credit System

A full-stack web application featuring a comprehensive referral and credit system for an online course marketplace. Built with modern technologies including Next.js, Express, MongoDB, and NextAuth.

## 📋 Table of Contents


- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Business Logic](#business-logic)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Sequence Diagram](#sequence-diagram)
- [Environment Variables](#environment-variables)
- [Development](#development)

## 🌟 Overview

This project implements a referral and credit system for an online course store. Users can:
- Register with a unique referral code
- Share their referral link with friends
- Earn credits when referred users make their first purchase
- Browse and purchase courses
- Track referral performance on a dashboard

## 🏗️ System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                      (Next.js 14)                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │   Pages    │  │ Components │  │  NextAuth Session  │   │
│  │            │  │            │  │                    │   │
│  │ - Home     │  │ - Navbar   │  │  - JWT Storage     │   │
│  │ - Register │  │ - CourseCard│  │  - Auth Provider  │   │
│  │ - Login    │  │ - Notif.   │  │                    │   │
│  │ - Dashboard│  │            │  │                    │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
│                                                             │
│  ┌────────────┐  ┌────────────┐                           │
│  │  Zustand   │  │ API Client │                           │
│  │  (State)   │  │  (Axios)   │                           │
│  └────────────┘  └────────────┘                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API + JWT
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                       Backend                               │
│                  (Node.js + Express)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Routes      │  │ Controllers  │  │   Middleware     │ │
│  │              │  │              │  │                  │ │
│  │ - Auth       │  │ - Register   │  │ - JWT Auth       │ │
│  │ - Courses    │  │ - Login      │  │ - Error Handler  │ │
│  │ - Dashboard  │  │ - Purchase   │  │                  │ │
│  │              │  │ - Stats      │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │  Validators  │  │   Models     │                       │
│  │   (Zod)      │  │  (Mongoose)  │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    MongoDB Database                         │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │  User Collection │          │ Course Collection│        │
│  │                  │          │                  │        │
│  │ - username       │          │ - title          │        │
│  │ - email          │          │ - description    │        │
│  │ - password       │          │ - price          │        │
│  │ - referralCode   │          │                  │        │
│  │ - referredBy     │          │                  │        │
│  │ - credits        │          │                  │        │
│  │ - hasConverted   │          │                  │        │
│  └──────────────────┘          └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Authentication:** NextAuth.js
- **State Management:** Zustand
- **Form Handling:** React Hook Form
- **Validation:** Zod
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Zod
- **ID Generation:** nanoid

## ✨ Core Features

### 1. User Authentication
- Secure registration with password hashing
- JWT-based authentication
- NextAuth integration for session management
- Protected routes and API endpoints

### 2. Referral System
- Unique referral code generation for each user
- URL-based referral tracking (`?r=CODE`)
- Automatic referrer-referred relationship creation
- Referral link sharing with copy-to-clipboard

### 3. Credit System
- First-purchase credit rewards (2 credits for both parties)
- Prevents multiple credit awards using `hasConverted` flag
- Atomic database transactions for consistency
- Real-time credit balance tracking

### 4. Dashboard
- Referral performance statistics
- Conversion rate tracking
- Shareable referral link
- User-friendly metrics visualization

### 5. Course Marketplace
- Browse available courses
- One-click course purchase
- Responsive course cards with animations
- Real-time purchase feedback

## 💼 Business Logic

### The `hasConverted` Flag: Core Referral Logic

The entire referral credit system hinges on the `hasConverted` boolean field in the User model:

```typescript
hasConverted: {
  type: Boolean,
  default: false,
}
```

**How it works:**

1. **User Registration:**
   - User signs up (optionally with a referral code)
   - `hasConverted` is set to `false`
   - If referral code is valid, `referredBy` is set to referrer's ID

2. **First Purchase:**
   - User clicks "Buy Course"
   - System checks `hasConverted` flag
   - If `false`:
     - Set `hasConverted = true`
     - Award 2 credits to the buyer
     - If `referredBy` exists, award 2 credits to the referrer
   - Transaction is atomic (uses MongoDB session)

3. **Subsequent Purchases:**
   - `hasConverted` is already `true`
   - No credits are awarded
   - Purchase succeeds but no referral rewards

**Why this approach?**
- ✅ **Prevents double-crediting:** Once converted, always converted
- ✅ **Simple and reliable:** Single boolean check
- ✅ **Database-enforced:** Transactions ensure consistency
- ✅ **Scalable:** No complex tracking tables needed

### Atomic Transaction Example

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Mark user as converted
  user.hasConverted = true;
  user.credits += 2;

  // Credit referrer if exists
  if (user.referredBy) {
    const referrer = await User.findById(user.referredBy).session(session);
    referrer.credits += 2;
    await referrer.save({ session });
  }

  await user.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

## 📁 Project Structure

```
filesure-assignment/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.ts    # Register & login logic
│   │   │   ├── courseController.ts  # Course fetching
│   │   │   └── dashboardController.ts # Purchase & stats
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification
│   │   │   └── errorHandler.ts      # Global error handling
│   │   ├── models/
│   │   │   ├── User.ts              # User schema
│   │   │   └── Course.ts            # Course schema
│   │   ├── routes/
│   │   │   ├── auth.ts              # Auth routes
│   │   │   ├── courses.ts           # Course routes
│   │   │   └── dashboard.ts         # Dashboard routes
│   │   ├── scripts/
│   │   │   └── seed.ts              # Database seeding
│   │   ├── utils/
│   │   │   └── referralCode.ts      # Code generation
│   │   ├── validators/
│   │   │   └── auth.ts              # Zod schemas
│   │   └── server.ts                # Express app
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── auth/
│   │   │   │       └── [...nextauth]/
│   │   │   │           └── route.ts  # NextAuth config
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Dashboard page
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx          # Register page
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Home/Store page
│   │   │   └── globals.css           # Global styles
│   │   ├── components/
│   │   │   ├── courses/
│   │   │   │   └── CourseCard.tsx    # Course display
│   │   │   ├── layout/
│   │   │   │   └── Navbar.tsx        # Navigation
│   │   │   ├── providers/
│   │   │   │   └── AuthProvider.tsx  # Session provider
│   │   │   └── ui/
│   │   │       └── Notification.tsx  # Toast notifications
│   │   ├── lib/
│   │   │   └── api.ts                # API client & functions
│   │   └── store/
│   │       └── useStore.ts           # Zustand stores
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── .env.example
│
└── package.json                      # Root package.json
```

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** (local or Atlas)
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd filesure-assignment
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Configure Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/course-store
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXTAUTH_SECRET=your_nextauth_secret_change_this_in_production
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# MacOS (Homebrew)
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

**Option B: MongoDB Atlas**
- Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Update `MONGO_URI` in `backend/.env`

### 5. Seed the Database

```bash
cd backend
npm run seed
```

You should see:
```
✅ MongoDB connected successfully
✅ Cleared existing courses
✅ Seeded 5 courses

📚 Created Courses:
  - Advanced TypeScript ($49)
  - Next.js 14 Deep Dive ($59)
  - Modern Backend with Express & Zod ($39)
  - Tailwind CSS From Scratch ($29)
  - Full-Stack Authentication Mastery ($44)
```

### 6. Start Development Servers

**Option A: Start Both Servers**
```bash
# From root directory
npm run dev
```

**Option B: Start Individually**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 7. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST `/auth/register`
Register a new user and optionally use a referral code.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "referrerCode": "LINA1234" // Optional
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "referralCode": "JOHN5678",
    "credits": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/auth/login`
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "referralCode": "JOHN5678",
    "credits": 2
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Course Endpoints

#### GET `/courses`
Retrieve all available courses.

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "title": "Advanced TypeScript",
      "description": "Master advanced TypeScript concepts...",
      "price": 49
    }
  ]
}
```

#### POST `/courses/:id/purchase`
Purchase a course. Awards credits on first purchase.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 - First Purchase):**
```json
{
  "message": "Course purchased successfully! First purchase completed.",
  "creditsEarned": 2,
  "userCredits": 2,
  "referrerCredited": true
}
```

**Response (200 - Subsequent Purchase):**
```json
{
  "message": "Course purchased successfully",
  "creditsEarned": 0,
  "note": "No referral credits earned (not first purchase)"
}
```

### Dashboard Endpoints

#### GET `/dashboard/stats`
Get referral statistics for the authenticated user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalReferredUsers": 5,
    "convertedUsers": 3,
    "totalCreditsEarned": 6,
    "referralLink": "http://localhost:3000/register?r=JOHN5678",
    "referralCode": "JOHN5678",
    "username": "johndoe"
  }
}
```

## 📊 Sequence Diagram

Below is a Mermaid sequence diagram illustrating the complete flow when Ryan signs up using Lina's referral link and makes his first purchase:

\`\`\`mermaid
sequenceDiagram
    actor Lina
    actor Ryan
    participant Frontend
    participant NextAuth
    participant Backend
    participant MongoDB

    Note over Lina,MongoDB: PHASE 1: Lina's Registration

    Lina->>Frontend: Opens /register
    Lina->>Frontend: Submits registration form
    Frontend->>Backend: POST /api/auth/register<br/>{username, email, password}
    Backend->>Backend: Hash password with bcrypt
    Backend->>Backend: Generate unique referralCode<br/>(e.g., "LINA1234")
    Backend->>MongoDB: Create User<br/>{...data, referralCode: "LINA1234"}
    MongoDB-->>Backend: User created
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: {user, token}
    Frontend-->>Lina: Registration successful

    Note over Lina,MongoDB: PHASE 2: Lina Shares Referral Link

    Lina->>Frontend: Navigates to /dashboard
    Frontend->>NextAuth: Get session & JWT
    NextAuth-->>Frontend: Session with JWT
    Frontend->>Backend: GET /api/dashboard/stats<br/>Authorization: Bearer <JWT>
    Backend->>Backend: Verify JWT & extract userId
    Backend->>MongoDB: Find User by userId
    MongoDB-->>Backend: User data (referralCode)
    Backend->>MongoDB: Count referred users
    MongoDB-->>Backend: Statistics
    Backend-->>Frontend: {referralLink, stats}
    Frontend-->>Lina: Display:<br/>localhost:3000/register?r=LINA1234
    Lina->>Ryan: Shares referral link

    Note over Lina,MongoDB: PHASE 3: Ryan's Registration with Referral

    Ryan->>Frontend: Clicks Lina's link<br/>Opens /register?r=LINA1234
    Frontend->>Frontend: Parse URL param<br/>Extract r=LINA1234
    Ryan->>Frontend: Submits registration form
    Frontend->>Backend: POST /api/auth/register<br/>{username, email, password,<br/>referrerCode: "LINA1234"}
    Backend->>Backend: Hash password
    Backend->>Backend: Generate referralCode<br/>(e.g., "RYAN5678")
    Backend->>MongoDB: Find User by<br/>referralCode="LINA1234"
    MongoDB-->>Backend: Lina's User document
    Backend->>Backend: Set referredBy = Lina's _id
    Backend->>MongoDB: Create User<br/>{...data, referralCode: "RYAN5678",<br/>referredBy: Lina's _id,<br/>hasConverted: false}
    MongoDB-->>Backend: User created
    Backend->>Backend: Generate JWT for Ryan
    Backend-->>Frontend: {user, token}
    Frontend-->>Ryan: Registration successful

    Note over Lina,MongoDB: PHASE 4: Ryan Makes First Purchase

    Ryan->>Frontend: Navigates to /courses
    Frontend->>Backend: GET /api/courses
    Backend->>MongoDB: Find all courses
    MongoDB-->>Backend: Course list
    Backend-->>Frontend: {courses}
    Frontend-->>Ryan: Display course cards

    Ryan->>Frontend: Clicks "Buy Course"
    Frontend->>NextAuth: Get session & JWT
    NextAuth-->>Frontend: Ryan's JWT
    Frontend->>Backend: POST /api/courses/:id/purchase<br/>Authorization: Bearer <JWT>
    
    Backend->>Backend: Verify JWT & extract userId
    Backend->>MongoDB: START TRANSACTION
    Backend->>MongoDB: Find Ryan by userId<br/>(with session lock)
    MongoDB-->>Backend: Ryan's User<br/>{hasConverted: false,<br/>referredBy: Lina's _id}
    
    Backend->>Backend: Check hasConverted flag
    Backend->>Backend: hasConverted = false ✅<br/>Proceed with credit award
    
    Backend->>Backend: Set Ryan.hasConverted = true
    Backend->>Backend: Ryan.credits += 2
    Backend->>MongoDB: Save Ryan<br/>(within transaction)
    
    Backend->>MongoDB: Find Lina by _id<br/>(with session lock)
    MongoDB-->>Backend: Lina's User
    Backend->>Backend: Lina.credits += 2
    Backend->>MongoDB: Save Lina<br/>(within transaction)
    
    Backend->>MongoDB: COMMIT TRANSACTION
    MongoDB-->>Backend: Transaction successful
    
    Backend-->>Frontend: {message: "First purchase!",<br/>creditsEarned: 2,<br/>referrerCredited: true}
    Frontend-->>Ryan: 🎉 Success! You earned 2 credits!

    Note over Lina,MongoDB: Result: Ryan.hasConverted = true<br/>Ryan.credits = 2<br/>Lina.credits = 2

    Note over Lina,MongoDB: PHASE 5: Ryan's Future Purchases (No Credits)

    Ryan->>Frontend: Clicks "Buy Course" again
    Frontend->>Backend: POST /api/courses/:id/purchase<br/>Authorization: Bearer <JWT>
    Backend->>MongoDB: Find Ryan by userId
    MongoDB-->>Backend: Ryan's User<br/>{hasConverted: true}
    Backend->>Backend: Check hasConverted flag
    Backend->>Backend: hasConverted = true ❌<br/>Skip credit logic
    Backend-->>Frontend: {message: "Course purchased",<br/>creditsEarned: 0}
    Frontend-->>Ryan: Purchase successful<br/>(no credits earned)
\`\`\`

## 🔐 Environment Variables

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/course-store` |
| `JWT_SECRET` | Secret for JWT signing | `your_super_secret_jwt_key` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | NextAuth encryption secret | `your_nextauth_secret` |
| `NEXTAUTH_URL` | Application base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |

## 👨‍💻 Development

### Available Scripts

#### Root
```bash
npm run dev              # Start both servers
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run seed             # Seed database
npm run install:all      # Install all dependencies
```

#### Backend
```bash
npm run dev              # Start with nodemon
npm run build            # Compile TypeScript
npm run start            # Start production server
npm run seed             # Seed courses
```

#### Frontend
```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Testing the Referral Flow

1. **Register Lina:**
   - Go to http://localhost:3000/register
   - Create account: `lina@example.com`
   - Note her referral code from dashboard

2. **Share Link:**
   - Login as Lina
   - Go to dashboard
   - Copy referral link

3. **Register Ryan:**
   - Logout
   - Open referral link: `http://localhost:3000/register?r=LINA1234`
   - Create account: `ryan@example.com`

4. **Make First Purchase:**
   - Login as Ryan
   - Go to home page
   - Click "Buy Course" on any course
   - See success message with credits earned

5. **Verify Credits:**
   - Check Ryan's dashboard: should show 2 credits
   - Login as Lina
   - Check Lina's dashboard: should show 2 credits and 1 converted user

6. **Test Idempotency:**
   - As Ryan, purchase another course
   - Verify no additional credits are awarded

## 🎨 Design Decisions

### 1. Monorepo Structure
- **Why:** Easier development and deployment
- **Benefit:** Single Git repository, shared tooling

### 2. NextAuth for Authentication
- **Why:** Industry-standard, well-maintained
- **Benefit:** Secure session management, easy JWT handling

### 3. Zustand for State Management
- **Why:** Lightweight, simple API
- **Benefit:** No Redux boilerplate, better performance

### 4. MongoDB Transactions
- **Why:** ACID compliance for credit awards
- **Benefit:** No race conditions, data consistency

### 5. `hasConverted` Boolean Flag
- **Why:** Simple, reliable, scalable
- **Benefit:** Single source of truth, prevents double-crediting

### 6. Tailwind CSS Only
- **Why:** Per project requirements (no UI kits)
- **Benefit:** Full design control, smaller bundle size

## 🔒 Security Considerations

1. **Password Hashing:** bcryptjs with salt rounds of 12
2. **JWT Tokens:** Signed with secret, 7-day expiration
3. **Environment Variables:** All secrets in `.env` files
4. **CORS:** Restricted to frontend URL
5. **Input Validation:** Zod schemas on both client and server
6. **MongoDB Injection:** Mongoose sanitizes queries
7. **Protected Routes:** JWT middleware on sensitive endpoints

## 🚢 Production Deployment

### Backend (Heroku/Railway/Render)

1. Set environment variables
2. Use production MongoDB (Atlas)
3. Build: `npm run build`
4. Start: `npm start`

### Frontend (Vercel/Netlify)

1. Set environment variables
2. Update `NEXT_PUBLIC_API_URL` to production backend
3. Build: `npm run build`
4. Deploy `frontend` folder

## 📝 License

This project is created for the Filesure Full Stack Developer Intern assignment.

## 👤 Author

Created as part of a technical assessment for Filesure.

---

**Built with ❤️ using Next.js, Express, and MongoDB**
