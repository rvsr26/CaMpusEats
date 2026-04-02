const { body, validationResult } = require("express-validator");

// Middleware to run after validators and return errors
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

// --- Auth Validators ---
const validateRegister = [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 80 }).withMessage("Name too long"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),
    handleValidation,
];

const validateLogin = [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidation,
];

const validateForgotPassword = [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    handleValidation,
];

const validateResetPassword = [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    handleValidation,
];

// --- Menu Validators ---
const validateMenuItem = [
    body("name").trim().notEmpty().withMessage("Item name is required"),
    body("category").isIn(["Snacks", "Fast Food", "Beverages", "Meals", "Desserts", "Other"]).withMessage("Invalid category"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    handleValidation,
];

// --- Wallet Validators ---
const validateRecharge = [
    body("amount").isFloat({ min: 1 }).withMessage("Amount must be at least ₹1"),
    handleValidation,
];

// --- Rating Validators ---
const validateRating = [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("menuItemId").notEmpty().withMessage("Menu item ID is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("comment").optional().isLength({ max: 500 }).withMessage("Comment too long"),
    handleValidation,
];

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateMenuItem,
    validateRecharge,
    validateRating,
};
