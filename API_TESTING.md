# API Testing Guide

This file contains example API requests for testing the Course Store backend.

## Environment Setup

**Base URL:** `http://localhost:5000`

**Variables:**
- `baseUrl`: http://localhost:5000
- `token`: (will be set after login)

---


## 1. Health Check

### GET /health

```bash
curl http://localhost:5000/health
```

**Expected Response (200):**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## 2. Register User (Lina)

### POST /api/auth/register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "lina",
    "email": "lina@example.com",
    "password": "password123"
  }'
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "username": "lina",
    "email": "lina@example.com",
    "referralCode": "LINA1234",
    "credits": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the `token` for authenticated requests!**

---

## 3. Login

### POST /api/auth/login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lina@example.com",
    "password": "password123"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "lina",
    "email": "lina@example.com",
    "referralCode": "LINA1234",
    "credits": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4. Get Dashboard Stats

### GET /api/dashboard/stats

```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "totalReferredUsers": 0,
    "convertedUsers": 0,
    "totalCreditsEarned": 0,
    "referralLink": "http://localhost:3000/register?r=LINA1234",
    "referralCode": "LINA1234",
    "username": "lina"
  }
}
```

---

## 5. Register User with Referral (Ryan)

### POST /api/auth/register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ryan",
    "email": "ryan@example.com",
    "password": "password123",
    "referrerCode": "LINA1234"
  }'
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "username": "ryan",
    "email": "ryan@example.com",
    "referralCode": "RYAN5678",
    "credits": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save Ryan's token for next steps!**

---

## 6. Get All Courses

### GET /api/courses

```bash
curl -X GET http://localhost:5000/api/courses
```

**Expected Response (200):**
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
    },
    {
      "_id": "...",
      "title": "Next.js 14 Deep Dive",
      "description": "Build high-performance web applications...",
      "price": 59
    }
  ]
}
```

**Copy a course `_id` for the purchase test!**

---

## 7. Purchase Course (First Time)

### POST /api/courses/:id/purchase

```bash
curl -X POST http://localhost:5000/api/courses/COURSE_ID_HERE/purchase \
  -H "Authorization: Bearer RYAN_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "message": "Course purchased successfully! First purchase completed.",
  "creditsEarned": 2,
  "userCredits": 2,
  "referrerCredited": true
}
```

---

## 8. Verify Credits (Lina)

### GET /api/dashboard/stats

```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer LINA_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "totalReferredUsers": 1,
    "convertedUsers": 1,
    "totalCreditsEarned": 2,
    "referralLink": "http://localhost:3000/register?r=LINA1234",
    "referralCode": "LINA1234",
    "username": "lina"
  }
}
```

---

## 9. Purchase Course Again (Should Not Award Credits)

### POST /api/courses/:id/purchase

```bash
curl -X POST http://localhost:5000/api/courses/ANOTHER_COURSE_ID/purchase \
  -H "Authorization: Bearer RYAN_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "message": "Course purchased successfully",
  "creditsEarned": 0,
  "note": "No referral credits earned (not first purchase)"
}
```

---

## 10. Error Cases

### Invalid Email Format

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "invalid-email",
    "password": "password123"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

### Missing Authorization

```bash
curl -X GET http://localhost:5000/api/dashboard/stats
```

**Expected Response (401):**
```json
{
  "error": "No token provided"
}
```

### Invalid Token

```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response (401):**
```json
{
  "error": "Invalid or expired token"
}
```

### Invalid Credentials

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lina@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Course Store API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Courses",
      "item": [
        {
          "name": "Get Courses",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/courses",
              "host": ["{{baseUrl}}"],
              "path": ["api", "courses"]
            }
          }
        },
        {
          "name": "Purchase Course",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/api/courses/:id/purchase",
              "host": ["{{baseUrl}}"],
              "path": ["api", "courses", ":id", "purchase"],
              "variable": [
                {
                  "key": "id",
                  "value": ""
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Dashboard",
      "item": [
        {
          "name": "Get Stats",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/api/dashboard/stats",
              "host": ["{{baseUrl}}"],
              "path": ["api", "dashboard", "stats"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Testing Script

```bash
#!/bin/bash

# Automated test script

BASE_URL="http://localhost:5000"

echo "🧪 Testing Course Store API"
echo ""

# 1. Health Check
echo "1️⃣ Health Check..."
curl -s $BASE_URL/health | jq
echo ""

# 2. Register Lina
echo "2️⃣ Registering Lina..."
LINA_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"lina","email":"lina@test.com","password":"pass123"}')
LINA_TOKEN=$(echo $LINA_RESPONSE | jq -r '.token')
LINA_CODE=$(echo $LINA_RESPONSE | jq -r '.user.referralCode')
echo "Lina's referral code: $LINA_CODE"
echo ""

# 3. Register Ryan with referral
echo "3️⃣ Registering Ryan with Lina's referral..."
RYAN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"ryan\",\"email\":\"ryan@test.com\",\"password\":\"pass123\",\"referrerCode\":\"$LINA_CODE\"}")
RYAN_TOKEN=$(echo $RYAN_RESPONSE | jq -r '.token')
echo "Ryan registered successfully"
echo ""

# 4. Get courses
echo "4️⃣ Fetching courses..."
COURSES=$(curl -s $BASE_URL/api/courses)
COURSE_ID=$(echo $COURSES | jq -r '.data[0]._id')
echo "Found course ID: $COURSE_ID"
echo ""

# 5. Ryan purchases course
echo "5️⃣ Ryan purchasing course..."
PURCHASE=$(curl -s -X POST $BASE_URL/api/courses/$COURSE_ID/purchase \
  -H "Authorization: Bearer $RYAN_TOKEN")
echo $PURCHASE | jq
echo ""

# 6. Check Lina's stats
echo "6️⃣ Checking Lina's dashboard..."
curl -s $BASE_URL/api/dashboard/stats \
  -H "Authorization: Bearer $LINA_TOKEN" | jq
echo ""

echo "✅ Tests completed!"
```

Save as `test-api.sh` and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

**Happy Testing! 🚀**
