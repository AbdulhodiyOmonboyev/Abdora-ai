# 📚 Abdora AI - API Documentation

Complete REST API reference for Abdora AI.

## Base URL

```
https://api.abdora.uz/api
```

## Authentication

All endpoints require JWT token:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "name": "User Name",
    "role": "admin"
  }
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password",
  "role": "student"
}

Response:
{
  "message": "User created successfully",
  "user": { ... }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer TOKEN

Response:
{
  "id": "1",
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## User Endpoints

### Get All Users
```http
GET /users?role=student&search=john&limit=20&offset=0
Authorization: Bearer TOKEN

Response:
[
  {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "phone": "+998912345678"
  },
  ...
]
```

### Get User by ID
```http
GET /users/{id}
Authorization: Bearer TOKEN

Response:
{
  "id": "1",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "phone": "+998912345678",
  "address": "Tashkent, Uzbekistan"
}
```

### Create User
```http
POST /users
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "New User",
  "email": "new@example.com",
  "phone": "+998912345678",
  "password": "password",
  "role": "student"
}

Response: { ... user data ... }
```

### Update User
```http
PUT /users/{id}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+998912345678"
}

Response: { ... updated user ... }
```

### Delete User
```http
DELETE /users/{id}
Authorization: Bearer TOKEN

Response:
{
  "message": "User deleted successfully"
}
```

---

## Group Endpoints

### Get All Groups
```http
GET /groups?branch={branchId}&teacher={teacherId}&limit=20

Response:
[
  {
    "id": "1",
    "name": "Biology 101",
    "subject": "Biology",
    "teacher": { ... },
    "branch": { ... },
    "students": [ ... ],
    "schedule": { ... }
  },
  ...
]
```

### Get Group Details
```http
GET /groups/{id}

Response:
{
  "id": "1",
  "name": "Biology 101",
  "subject": "Biology",
  "description": "Introduction to Biology",
  "teacher": { ... },
  "branch": { ... },
  "students": [ ... ],
  "lessons": [ ... ],
  "tests": [ ... ],
  "monthlyFee": 100000
}
```

### Create Group
```http
POST /groups
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Biology 101",
  "subject": "Biology",
  "teacherId": "2",
  "branchId": "1",
  "monthlyFee": 100000,
  "maxStudents": 30,
  "schedule": {
    "weekDays": ["Monday", "Wednesday"],
    "startTime": "09:00",
    "endTime": "10:30"
  }
}
```

---

## Lesson Endpoints

### Get All Lessons
```http
GET /lessons?group={groupId}&teacher={teacherId}&limit=20

Response:
[
  {
    "id": "1",
    "title": "Lesson Title",
    "content": "Lesson content...",
    "group": { ... },
    "teacher": { ... },
    "createdAt": "2024-08-12T00:00:00Z"
  },
  ...
]
```

### Get Lesson Details
```http
GET /lessons/{id}

Response:
{
  "id": "1",
  "title": "Lesson Title",
  "content": "Rich HTML content...",
  "videoUrl": "https://...",
  "resources": [ ... ],
  "aiContent": {
    "status": "done",
    "summary": "...",
    "keyPoints": [ ... ]
  }
}
```

### Create Lesson
```http
POST /lessons
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "New Lesson",
  "content": "<p>Lesson content...</p>",
  "groupId": "1",
  "videoUrl": "https://...",
  "resources": [ ... ]
}
```

---

## Test Endpoints

### Get All Tests
```http
GET /tests?group={groupId}&teacher={teacherId}

Response:
[
  {
    "id": "1",
    "title": "Biology Quiz 1",
    "group": { ... },
    "totalQuestions": 20,
    "duration": 45,
    "createdAt": "2024-08-12T00:00:00Z"
  },
  ...
]
```

### Get Test Details
```http
GET /tests/{id}

Response:
{
  "id": "1",
  "title": "Biology Quiz 1",
  "description": "...",
  "questions": [ ... ],
  "duration": 45,
  "passingScore": 60
}
```

### Submit Test
```http
POST /tests/{id}/submit
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "studentId": "3",
  "answers": {
    "1": "A",
    "2": "B",
    "3": "C"
  }
}

Response:
{
  "score": 85,
  "percentage": 85,
  "passed": true
}
```

---

## Attendance Endpoints

### Mark Attendance
```http
POST /attendance
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "groupId": "1",
  "date": "2024-08-12",
  "records": [
    { "studentId": "1", "status": "present" },
    { "studentId": "2", "status": "absent" },
    { "studentId": "3", "status": "late" }
  ]
}
```

### Get Attendance
```http
GET /attendance?group={groupId}&student={studentId}&month={2024-08}

Response:
[
  {
    "date": "2024-08-12",
    "studentId": "1",
    "status": "present",
    "time": "09:30"
  },
  ...
]
```

---

## Payment Endpoints

### Get Payments
```http
GET /payments?group={groupId}&month={2024-08}

Response:
{
  "group": { ... },
  "monthlyFee": 100000,
  "students": [
    {
      "id": "1",
      "name": "Student Name",
      "isPaid": true,
      "paidAmount": 100000,
      "paidDate": "2024-08-01"
    },
    ...
  ]
}
```

### Record Payment
```http
POST /payments
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "studentId": "1",
  "groupId": "1",
  "amount": 100000,
  "month": "2024-08",
  "paymentMethod": "cash"
}

Response:
{
  "id": "1",
  "status": "success",
  "transactionId": "TXN-123456"
}
```

---

## Analytics Endpoints

### Student Analytics
```http
GET /analytics/student

Response:
{
  "totalTests": 5,
  "averageScore": 82,
  "totalLessons": 20,
  "lessonsCompleted": 15,
  "xp": 2500,
  "level": 5,
  "scoreHistory": [ ... ],
  "topicScores": { ... }
}
```

### Teacher Analytics
```http
GET /analytics/teacher

Response:
{
  "totalStudents": 45,
  "totalGroups": 3,
  "averageClassScore": 78,
  "totalLessons": 30,
  "totalTests": 10,
  "studentProgress": [ ... ]
}
```

### Admin Analytics
```http
GET /analytics/admin

Response:
{
  "totalUsers": 500,
  "totalStudents": 350,
  "totalTeachers": 100,
  "totalBranches": 5,
  "totalRevenue": 50000000,
  "activeUsers": 250,
  "userGrowth": [ ... ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Email is required",
  "details": { ... }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An error occurred while processing your request"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 500  | Internal Server Error |

---

## Rate Limiting

- **Limit:** 1000 requests per hour per IP
- **Headers:**
  - `X-RateLimit-Limit`: 1000
  - `X-RateLimit-Remaining`: 999
  - `X-RateLimit-Reset`: 1629004800

---

## Pagination

All list endpoints support pagination:

```
GET /users?limit=20&offset=0

Response headers:
X-Total-Count: 500
X-Page-Count: 25
```

---

**Last Updated:** August 2024  
**API Version:** 1.0  
**Status:** Active ✅

For issues: [GitHub Issues](https://github.com/AbdulhodiyOmonboyev/Abdora-ai/issues)
