const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");
const logger = require("../utils/logger");

// Helper: generate access token (short-lived)
const generateAccessToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });

// Helper: generate refresh token (long-lived)
const generateRefreshToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh", { expiresIn: "7d" });

// Helper: set refresh token cookie
const setRefreshCookie = (res, token) => {
    res.cookie("canteen_refresh", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

// @desc   Register new user
// @route  POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const user = await User.create({ name, email, password, phone, verificationToken });

        // Send verification email (non-blocking - won't fail registration if email fails)
        if (process.env.EMAIL_FROM) {
            try {
                await sendVerificationEmail(email, verificationToken);
            } catch (emailErr) {
                logger.warn("Verification email failed to send:", emailErr.message);
            }
            return res.status(201).json({
                message: "Registration successful! Please check your email to verify your account.",
            });
        }

        // Dev mode: auto-verify and return user data + tokens
        user.isVerified = true;
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();
        setRefreshCookie(res, refreshToken);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            walletBalance: user.walletBalance,
            loyaltyPoints: user.loyaltyPoints,
            token: accessToken,
            message: "Registration successful!",
        });
    } catch (err) {
        logger.error(`registerUser error: ${err.message}`, { stack: err.stack });
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
};

// @desc   Verify email
// @route  GET /api/auth/verify-email?token=xxx
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: "Token is required" });

        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).json({ message: "Invalid or expired verification link" });

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.json({ message: "Email verified successfully! You can now log in." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Auth user & get token
// @route  POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // Check email verification (only if EMAIL_FROM is configured)
        if (process.env.EMAIL_FROM && !user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Store refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        setRefreshCookie(res, refreshToken);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            walletBalance: user.walletBalance,
            loyaltyPoints: user.loyaltyPoints,
            currentStreak: user.currentStreak,
            badges: user.badges,
            totalCarbonSaved: user.totalCarbonSaved,
            sustainabilityLevel: user.sustainabilityLevel,
            token: accessToken,
        });
    } catch (err) {
        logger.error("loginUser error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc   Refresh access token
// @route  POST /api/auth/refresh
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.canteen_refresh;
        if (!token) return res.status(401).json({ message: "No refresh token" });

        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh"
        );
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== token) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken(user._id);
        res.json({ token: newAccessToken });
    } catch (err) {
        res.status(401).json({ message: "Refresh token expired or invalid" });
    }
};

// @desc   Logout — clear refresh token
// @route  POST /api/auth/logout
const logoutUser = async (req, res) => {
    try {
        const token = req.cookies?.canteen_refresh;
        if (token) {
            await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null });
        }
        res.clearCookie("canteen_refresh");
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Forgot password
// @route  POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        // Always return success to prevent email enumeration
        if (!user) return res.json({ message: "If this email exists, a reset link has been sent." });

        // Remove existing tokens for user
        await PasswordResetToken.deleteMany({ userId: user._id });

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        await PasswordResetToken.create({ userId: user._id, token: hashedToken });

        if (process.env.EMAIL_FROM) {
            await sendPasswordResetEmail(user.email, rawToken);
        } else {
            // Dev mode: return token in response (REMOVE in production)
            return res.json({ message: "Dev mode: use this token", token: rawToken });
        }

        res.json({ message: "If this email exists, a reset link has been sent." });
    } catch (err) {
        logger.error("forgotPassword error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc   Reset password
// @route  POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const record = await PasswordResetToken.findOne({ token: hashedToken });
        if (!record) return res.status(400).json({ message: "Invalid or expired reset token" });

        const user = await User.findById(record.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.password = password; // will be hashed by pre-save hook
        user.refreshToken = null; // invalidate all sessions
        await user.save();

        await PasswordResetToken.deleteMany({ userId: user._id });

        res.json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get current user profile
// @route  GET /api/auth/profile
const getProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken -verificationToken");
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

// @desc   Update user profile
// @route  PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { name, phone, currentPassword, newPassword } = req.body;

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        // Change password
        if (currentPassword && newPassword) {
            const match = await user.matchPassword(currentPassword);
            if (!match) return res.status(400).json({ message: "Current password is incorrect" });
            if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
            user.password = newPassword;
        }

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            walletBalance: user.walletBalance,
            loyaltyPoints: user.loyaltyPoints,
            currentStreak: user.currentStreak,
            badges: user.badges,
            totalCarbonSaved: user.totalCarbonSaved,
            sustainabilityLevel: user.sustainabilityLevel,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   List all users (admin / manager)
// @route  GET /api/auth/users
const getUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (search) filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
        if (role) filter.role = role;
        const users = await User.find(filter)
            .select("-password -refreshToken -verificationToken -walletPin")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json(users);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc   Update a user's role  (admin only)
// @route  PUT /api/auth/users/:id/role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const VALID_ROLES = ["student", "staff", "accountant", "manager", "admin", "super-admin"];
        if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });
        // Prevent privilege escalation: cannot assign role above own
        const myLevel = VALID_ROLES.indexOf(req.user.role);
        const targetLevel = VALID_ROLES.indexOf(role);
        if (targetLevel > myLevel) return res.status(403).json({ message: "Cannot assign a role higher than your own" });
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
            .select("-password -refreshToken -verificationToken -walletPin");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
    registerUser, loginUser, verifyEmail, refreshToken,
    logoutUser, forgotPassword, resetPassword, getProfile, updateProfile,
    getUsers, updateUserRole,
};
