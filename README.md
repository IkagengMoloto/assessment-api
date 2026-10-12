# Interview Preparation Platform

**Full-Stack MERN Capstone Project — Full Stack Web and Software Development, Intermediate Batch-2**

An interview preparation and assessment platform built with MongoDB, Express.js, React, and Node.js. The application supports role-based assessment creation, administrative approval, student submissions, instructor review, scoring, and feedback.

## Features

### Student
- Register and sign in securely.
- Browse approved assessments and answer multiple-choice or descriptive questions.
- Submit an assessment once; duplicate attempts are prevented.
- View submission status, scores, reviewer feedback, and completed assessments.

### Instructor
- Create assessments with multiple-choice and descriptive questions.
- Manage questions and view student submissions.
- Start reviews, assign scores from 0 to 100, and provide written feedback.
- View student performance information.
- Submit newly created assessments for administrative approval before students can access them.

### Administrator
- Manage user accounts and account access.
- Review, approve, or reject assessments submitted for publication.
- View platform analytics, including users, assessments, and submission scores.

### Evaluator (API role)
- Access assigned submission-review endpoints, transition submissions to review, and record scores and feedback.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Development | npm, Nodemon, ESLint, Postman |

## Architecture

```text
Browser
  |
  v
React / Vite frontend (localhost:5173)
  |
  | Axios HTTP requests + JWT
  v
Express REST API (localhost:5000)
  |
  +-- Authentication and role authorization middleware
  +-- Routes and controllers
  +-- Mongoose models
  |
  v
MongoDB (127.0.0.1:27017)
```

## Repository Layout

```text
assessment-api/
├── config/                # Database configuration
├── controllers/           # API business logic
│   ├── adminController.js
│   ├── assessmentController.js
│   ├── authController.js
│   ├── submissionController.js
│   └── userController.js
├── middleware/            # Authentication, authorization, error handling
├── models/                # User, Assessment, Submission
├── routes/                # API endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── InstructorDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   └── services/api.js
│   └── package.json
├── seedAdmin.js
├── server.js
├── package.json
└── README.md
```

## Prerequisites

- Node.js and npm (the project was tested with Node.js 24).
- MongoDB running locally, or access to a configured MongoDB instance.
- Git (to clone the repository).

## Installation and Local Development

### 1. Clone the repository

```powershell
git clone https://github.com/IkagengMoloto/assessment-api.git
cd assessment-api
```

### 2. Install backend dependencies

```powershell
npm install
```

### 3. Configure backend environment

Create a `.env` file **in the repository root**:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/assessment_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Use a strong, unique JWT secret. **Do not commit `.env` or real credentials to GitHub.**

### 4. Start MongoDB

Ensure MongoDB is listening on `127.0.0.1:27017`, or update `MONGO_URI` to your environment.

### 5. Start the backend

In PowerShell terminal 1, from the repository root:

```powershell
npm run dev
```

The backend listens at `http://localhost:5000`. To check it, visit `http://localhost:5000/`.

Other backend commands:

```powershell
npm start          # Run with Node.js
npm run seed:admin # Seed initial admin (use only as needed)
```

Review `seedAdmin.js` before seeding and change any default/demo credentials before using the application outside local testing.

### 6. Install and start the frontend

In PowerShell terminal 2:

```powershell
cd assessment-api\frontend  # Omit if you are already in the frontend directory
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Keep the backend and frontend running in separate terminals.

Frontend quality and build commands:

```powershell
npm run build
npm run lint
npm run preview
```

> The frontend expects the API to be available at the configured backend address. If using different ports or hosts, review `frontend/src/services/api.js` and the frontend configuration.

## User Roles and Access Control

| Role | Main capabilities |
| --- | --- |
| Student | View approved assessments, submit answers, view scores and feedback |
| Instructor | Create assessments, manage questions, review and score submissions, view performance |
| Admin | Manage users, approve/reject assessments, view analytics |
| Evaluator | Review and score submissions through supported API endpoints |

JWT authentication protects private endpoints. Requests include the header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Passwords are stored as bcrypt hashes. The API applies authorization checks and validates submitted data. Access may be denied with `401 Unauthorized` (missing or invalid authentication) or `403 Forbidden` (insufficient role permissions).

## Assessment Lifecycle

1. **Instructor creates an assessment** containing MCQ or descriptive questions.
2. **Admin reviews the assessment** and approves or rejects it.
3. **Student views approved assessments** and submits answers.
4. **Instructor starts review** for descriptive submissions, changing the status from `submitted` to `pending_review`.
5. **Instructor scores the submission** and adds feedback, changing the status to `scored`.
6. **Student views the final score and feedback** on the dashboard.

Multiple-choice questions support automatic grading where applicable. Scores are on a 0–100 scale. The submission model uses a compound unique index on student and assessment to prevent multiple attempts for the same assessment.

```text
Assessment: pending approval --> approved / rejected

Submission: submitted --> pending_review --> scored
```

## Data Models

**User:** name, email, password hash, role, account active status, timestamps.

**Assessment:** title, description, questions, creator, approval status, timestamps. Questions support descriptive and multiple-choice formats with marks and answer options where relevant.

**Submission:** assessment reference, student reference, answers, status, score, reviewer reference, feedback, timestamps.

## Selected REST API Endpoints

The backend API is available under `http://localhost:5000`.

| Method | Endpoint | Purpose / role |
| --- | --- | --- |
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Authenticate and obtain JWT |
| GET | `/api/users` | List users (admin) |
| POST | `/api/users` | Create user (admin) |
| GET | `/api/assessments` | Retrieve assessments according to role and visibility |
| GET | `/api/assessments/:id` | Retrieve an assessment |
| POST | `/api/assessments` | Create assessment (authorized creator) |
| POST | `/api/submissions` | Submit answers (student) |
| GET | `/api/submissions/my` | Student's own submissions |
| GET | `/api/submissions/instructor/performance` | Instructor performance overview |
| PATCH | `/api/submissions/instructor/:id/review` | Instructor starts review |
| PATCH | `/api/submissions/instructor/:id/score` | Instructor records score and feedback |
| GET | `/api/submissions/pending` | Pending submissions (evaluator) |
| PATCH | `/api/submissions/:id/review` | Evaluator starts review |
| PATCH | `/api/submissions/:id/score` | Evaluator records score and feedback |

Additional admin routes provide user management, assessment approvals, and analytics. Refer to `routes/adminRoutes.js` and the other route files for the complete current endpoint definitions.

### Example: Student submission

```http
POST /api/submissions
Authorization: Bearer <STUDENT_JWT>
Content-Type: application/json
```

```json
{
  "assessmentId": "<ASSESSMENT_ID>",
  "answers": [
    {
      "questionId": "<QUESTION_ID>",
      "answer": "JWTs let the server validate a signed token for protected routes."
    }
  ]
}
```

### Example: Instructor scoring

```http
PATCH /api/submissions/instructor/<SUBMISSION_ID>/score
Authorization: Bearer <INSTRUCTOR_JWT>
Content-Type: application/json
```

```json
{
  "score": 90,
  "feedback": "Good explanation of JWT authentication."
}
```

## Validation and Error Handling

The backend validates assessment submissions, question IDs and answers, user permissions, and scores. It rejects duplicate submissions and uses HTTP status codes including:

| Status | Meaning |
| --- | --- |
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication missing or invalid |
| 403 | Access forbidden |
| 404 | Resource not found |
| 500 | Server error |

## Testing and Verification

The application was exercised through both API testing and the React browser interface.

**Completed full-stack integration scenario:**

1. Instructor created a descriptive assessment named **Day 5 Final Integration Test**.
2. Administrator approved the assessment.
3. Student viewed the approved assessment and submitted an answer explaining JWT authentication.
4. Instructor moved the submission to `pending_review`.
5. Instructor awarded **90%** and provided written feedback.
6. Student dashboard displayed the **scored** status, **90%** result, feedback, and reviewer.
7. The frontend production build completed successfully with `npm run build`.

Other tested areas include JWT login, role-based dashboards, student assessment visibility, question management, and administrator analytics. The README does not claim an automated test suite; the integration scenario above was manually verified.

## Known Considerations

- Older development database records created before approval/account-status fields were introduced may not appear in the current dashboard counts or approval lists. Legacy data should be reviewed or migrated before treating historical analytics as complete.
- This repository is configured for **local development**. Production deployment requires secure secrets, appropriate CORS settings, database access controls, TLS, and deployment-specific configuration.
- Never publish real student data, passwords, tokens, or the `.env` file.

## Source Code

GitHub: https://github.com/IkagengMoloto/assessment-api

## Project Author

David Moloto  
Full Stack Web and Software Development — Intermediate Batch-2
