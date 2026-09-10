# Assessment Management REST API

## Project Overview

The Assessment Management REST API is a backend application developed using Node.js, Express.js, MongoDB, and Mongoose.

The system provides secure authentication and role-based access control for three types of users:

- Admin
- Student
- Evaluator

Administrators can create assessments and questions. Students can view and submit assessments. Evaluators can review submitted assessments and assign scores between 0 and 100.

The system uses JSON Web Tokens (JWT) for authentication and implements role-based authorization middleware to protect API endpoints.

---

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- dotenv
- CORS
- Nodemon
- Postman
- MongoDB Compass
- Visual Studio Code

---

## Project Architecture

The application follows a modular backend architecture:

```text
Postman / API Client
        |
        v
Express REST API
        |
        v
Authentication Middleware
        |
        v
Role Authorization Middleware
        |
        v
Controllers
        |
        v
Mongoose Models
        |
        v
MongoDB Database
```

---

## Project Structure

```text
assessment-api/
|
|-- config/
|   |-- db.js
|
|-- controllers/
|   |-- assessmentController.js
|   |-- authController.js
|   |-- submissionController.js
|   |-- userController.js
|
|-- middleware/
|   |-- authMiddleware.js
|   |-- roleMiddleware.js
|
|-- models/
|   |-- Assessment.js
|   |-- Submission.js
|   |-- User.js
|
|-- routes/
|   |-- assessmentRoutes.js
|   |-- authRoutes.js
|   |-- submissionRoutes.js
|   |-- userRoutes.js
|
|-- .env
|-- .gitignore
|-- package.json
|-- seedAdmin.js
|-- server.js
|-- README.md
```

---

# User Roles

## Admin

The Admin is responsible for administrative functions.

Admin capabilities include:

- Login
- Create users
- View users
- Create assessments
- Create assessment questions
- View assessments

---

## Student

Students can:

- Register
- Login
- View assessments
- Submit assessment answers
- View their own submissions
- View scores
- View evaluator feedback

A student cannot submit the same assessment more than once.

---

## Evaluator

Evaluators can:

- Login
- View submitted assessments
- Move submissions to pending review
- Score submissions
- Provide feedback

Scores must be between 0 and 100.

---

# Authentication

The API uses JSON Web Token (JWT) authentication.

After successful login, the API returns a JWT.

Example:

```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "USER_ID",
    "name": "System Admin",
    "email": "admin@test.com",
    "role": "admin"
  }
}
```

Protected endpoints require:

```text
Authorization: Bearer <JWT_TOKEN>
```

Passwords are hashed using bcrypt before being stored in MongoDB.

---

# Role-Based Access Control

Authorization middleware restricts API operations according to the authenticated user's role.

Examples:

```text
Admin      -> Create assessments
Student    -> Submit assessments
Evaluator  -> Review and score submissions
```

Unauthorized roles receive:

```text
403 Forbidden
```

Example:

```json
{
  "success": false,
  "message": "Role 'student' is not authorized to access this resource"
}
```

Requests without authentication receive:

```text
401 Unauthorized
```

---

# Assessment Workflow

The submission workflow follows three states:

```text
submitted
    |
    v
pending_review
    |
    v
scored
```

### Step 1 — Student submits assessment

Initial status:

```text
submitted
```

### Step 2 — Evaluator starts review

Status changes to:

```text
pending_review
```

### Step 3 — Evaluator scores submission

Status changes to:

```text
scored
```

The final submission contains:

- Score
- Evaluator
- Feedback
- Submission status

---

# Database Models

## User

Important fields:

```text
name
email
password
role
createdAt
updatedAt
```

Allowed roles:

```text
admin
student
evaluator
```

---

## Assessment

Important fields:

```text
title
description
questions
createdBy
isActive
createdAt
updatedAt
```

Each question contains:

```text
questionText
marks
```

---

## Submission

Important fields:

```text
assessment
student
answers
status
score
evaluatedBy
feedback
createdAt
updatedAt
```

The Submission model references:

```text
Assessment
User (Student)
User (Evaluator)
```

A compound unique database index prevents the same student from submitting the same assessment more than once.

---

# API Endpoints

## Authentication

### Register Student

```http
POST /api/auth/register
```

Example request:

```json
{
  "name": "Test Student",
  "email": "student@example.com",
  "password": "password123"
}
```

---

### Login

```http
POST /api/auth/login
```

Example:

```json
{
  "email": "admin@test.com",
  "password": "<ADMIN_PASSWORD>"
}
```

---

# User Management

## Create User

Admin only.

```http
POST /api/users
```

Example:

```json
{
  "name": "Test Evaluator",
  "email": "evaluator@example.com",
  "password": "SecurePassword123!",
  "role": "evaluator"
}
```

---

## Get Users

Admin only.

```http
GET /api/users
```

---

# Assessments

## Create Assessment

Admin only.

```http
POST /api/assessments
```

Example:

```json
{
  "title": "JavaScript Fundamentals",
  "description": "Intermediate JavaScript assessment",
  "questions": [
    {
      "questionText": "Explain the difference between let and const.",
      "marks": 10
    },
    {
      "questionText": "What is an asynchronous function?",
      "marks": 10
    },
    {
      "questionText": "Explain the purpose of a REST API.",
      "marks": 10
    }
  ]
}
```

---

## Get Assessments

Authenticated users.

```http
GET /api/assessments
```

---

## Get Assessment by ID

Authenticated users.

```http
GET /api/assessments/:id
```

---

# Submissions

## Submit Assessment

Student only.

```http
POST /api/submissions
```

Example:

```json
{
  "assessmentId": "<ASSESSMENT_ID>",
  "answers": [
    {
      "questionId": "<QUESTION_ID_1>",
      "answer": "Answer to question one"
    },
    {
      "questionId": "<QUESTION_ID_2>",
      "answer": "Answer to question two"
    },
    {
      "questionId": "<QUESTION_ID_3>",
      "answer": "Answer to question three"
    }
  ]
}
```

The API validates that:

- The assessment exists.
- All questions are answered.
- Question IDs belong to the assessment.
- Duplicate question IDs are rejected.
- Empty answers are rejected.
- Duplicate assessment submissions are rejected.

---

## View My Submissions

Student only.

```http
GET /api/submissions/my
```

---

## View Pending Submissions

Evaluator only.

```http
GET /api/submissions/pending
```

---

## Start Review

Evaluator only.

```http
PATCH /api/submissions/:id/review
```

The submission status changes from:

```text
submitted -> pending_review
```

---

## Score Submission

Evaluator only.

```http
PATCH /api/submissions/:id/score
```

Example:

```json
{
  "score": 85,
  "feedback": "Good understanding of the concepts."
}
```

Score validation:

```text
Minimum: 0
Maximum: 100
```

After successful scoring:

```text
pending_review -> scored
```

---

# HTTP Status Codes

The API uses appropriate HTTP status codes.

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required or invalid token |
| 403 | User does not have permission |
| 404 | Resource not found |
| 500 | Internal server error |

---

# Validation and Security

The application implements:

- JWT authentication
- Password hashing using bcrypt
- Protected API routes
- Role-based authorization
- Input validation
- Assessment question validation
- Score validation from 0–100
- Duplicate submission protection
- MongoDB relationship references
- Environment variables
- HTTP error handling

---

# Installation

## 1. Install Node.js

Verify:

```bash
node --version
npm --version
```

## 2. Install MongoDB

MongoDB must be running locally on:

```text
127.0.0.1:27017
```

## 3. Install Dependencies

From the project directory:

```bash
npm install
```

## 4. Configure Environment Variables

Create:

```text
.env
```

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/assessment_db
JWT_SECRET=replace_with_a_secure_secret
JWT_EXPIRES_IN=1d
```

Never commit the `.env` file to a public repository.

---

# Create Initial Admin

Run:

```bash
node seedAdmin.js
```

The seed script creates the initial administrator account if it does not already exist.

Change any demonstration/default credentials before deploying the application outside a local development environment.

---

# Start Application

Run:

```bash
npm start
```

Expected output:

```text
Server running on port 5000
MongoDB connected: 127.0.0.1
```

Test:

```http
GET http://127.0.0.1:5000/
```

Expected:

```json
{
  "success": true,
  "message": "Assessment API is running"
}
```

---

# Postman Testing

The API was tested using Postman.

Testing includes:

1. Student registration
2. User login
3. JWT authentication
4. Missing-token rejection
5. Admin role restrictions
6. Student role restrictions
7. Evaluator role restrictions
8. Assessment creation
9. Invalid assessment validation
10. Student assessment submission
11. Duplicate submission rejection
12. Student viewing own submissions
13. Evaluator viewing pending submissions
14. Moving submission to pending review
15. Invalid score rejection
16. Evaluator scoring submission
17. Student viewing final score and feedback

---

# Example Security Tests

## Missing JWT

Request:

```http
GET /api/submissions/my
```

without a JWT.

Expected:

```text
401 Unauthorized
```

---

## Student Accessing Evaluator Route

Request:

```http
PATCH /api/submissions/:id/score
```

using a Student JWT.

Expected:

```text
403 Forbidden
```

---

## Evaluator Accessing Admin Route

Request:

```http
POST /api/users
```

using an Evaluator JWT.

Expected:

```text
403 Forbidden
```

---

## Invalid Score

Example:

```json
{
  "score": 150
}
```

Expected:

```text
400 Bad Request
```

---

# Author

Capstone Project

Full Stack Web and Software Development Intermediate Batch-2