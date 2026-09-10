const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createAssessment,
    getAssessments,
    getAssessmentById
} = require("../controllers/assessmentController");

const router = express.Router();

// ADMIN: Create assessment
router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createAssessment
);

// AUTHENTICATED USERS: View all assessments
router.get(
    "/",
    protect,
    getAssessments
);

// AUTHENTICATED USERS: View one assessment
router.get(
    "/:id",
    protect,
    getAssessmentById
);

module.exports = router;
