const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createUser,
    getUsers
} = require("../controllers/userController");

const router = express.Router();

router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createUser
);

router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getUsers
);

module.exports = router;