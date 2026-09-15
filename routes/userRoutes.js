const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createUser,
    getUsers,
    updateUserStatus
} = require("../controllers/userController");

const router = express.Router();

// ADMIN: Create a new user
router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createUser
);

// ADMIN: View all users
router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getUsers
);

// ADMIN: Activate or block a user
router.patch(
    "/:id/status",
    protect,
    authorizeRoles("admin"),
    updateUserStatus
);

module.exports = router;