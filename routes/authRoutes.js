const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
    registerUser, loginUser, verifyEmail, refreshToken,
    logoutUser, forgotPassword, resetPassword, getProfile, updateProfile, getUsers, updateUserRole,
} = require("../controllers/authController");
const { protect, managerOrAbove, adminOnly } = require("../middleware/authMiddleware");
const {
    validateRegister, validateLogin, validateForgotPassword, validateResetPassword,
} = require("../middleware/validationMiddleware");

// Rate limiter: 5 requests per 15 minutes for sensitive routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Too many attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth routes
router.post("/register", authLimiter, validateRegister, registerUser);
router.post("/login", authLimiter, validateLogin, loginUser);
router.get("/verify-email", verifyEmail);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.post("/forgot-password", authLimiter, validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/users", protect, managerOrAbove, getUsers);
router.put("/users/:id/role", protect, adminOnly, updateUserRole);

module.exports = router;
