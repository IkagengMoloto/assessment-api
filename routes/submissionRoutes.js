const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    submitAssessment,
    getMySubmissions,
    getPendingSubmissions,
    startReview,
    scoreSubmission,
    getInstructorPerformance,
    startInstructorReview,
    scoreInstructorSubmission
} = require("../controllers/submissionController");

const router = express.Router();

// STUDENT: Submit assessment answers
router.post(
    "/",
    protect,
    authorizeRoles("student"),
    submitAssessment
);

// STUDENT: View own submissions/results
router.get(
    "/my",
    protect,
    authorizeRoles("student"),
    getMySubmissions
);

// INSTRUCTOR: View student performance
// Only submissions for assessments created
// by the logged-in instructor are returned.
router.get(
    "/instructor/performance",
    protect,
    authorizeRoles("instructor"),
    getInstructorPerformance
);

// INSTRUCTOR: Start reviewing a submission
// Ownership is checked inside the controller.
router.patch(
    "/instructor/:id/review",
    protect,
    authorizeRoles("instructor"),
    startInstructorReview
);

// INSTRUCTOR: Score a submission
// Ownership is checked inside the controller.
router.patch(
    "/instructor/:id/score",
    protect,
    authorizeRoles("instructor"),
    scoreInstructorSubmission
);

// EVALUATOR: View submissions waiting for review
router.get(
    "/pending",
    protect,
    authorizeRoles("evaluator"),
    getPendingSubmissions
);

// EVALUATOR: Start reviewing a submission
router.patch(
    "/:id/review",
    protect,
    authorizeRoles("evaluator"),
    startReview
);

// EVALUATOR: Score submission
router.patch(
    "/:id/score",
    protect,
    authorizeRoles("evaluator"),
    scoreSubmission
);

module.exports = router;