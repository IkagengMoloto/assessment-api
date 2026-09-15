const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    getAnalytics
} = require("../controllers/adminController");

const router = express.Router();


// ADMIN: View platform analytics
router.get(
    "/analytics",
    protect,
    authorizeRoles("admin"),
    getAnalytics
);


module.exports = router;