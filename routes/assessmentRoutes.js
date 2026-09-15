const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    createAssessment,
    getAssessments,
    getAssessmentById,
    getPendingAssessments,
    updateAssessmentApproval
} = require("../controllers/assessmentController");

const router = express.Router();


// ADMIN / INSTRUCTOR: Create assessment
router.post(
    "/",
    protect,
    authorizeRoles("admin", "instructor"),
    createAssessment
);


// AUTHENTICATED USERS: View assessments
router.get(
    "/",
    protect,
    getAssessments
);


// ADMIN: View assessments pending approval
// IMPORTANT: This route must be before /:id
router.get(
    "/admin/pending",
    protect,
    authorizeRoles("admin"),
    getPendingAssessments
);


// ADMIN: Approve or reject assessment
router.patch(
    "/:id/approval",
    protect,
    authorizeRoles("admin"),
    updateAssessmentApproval
);


// AUTHENTICATED USERS: View one assessment
router.get(
    "/:id",
    protect,
    getAssessmentById
);


module.exports = router;