const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    submitAssessment,
    getMySubmissions,
    getPendingSubmissions,
    startReview,
    scoreSubmission
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