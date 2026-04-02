const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Role hierarchy (higher index = more permissions)
const ROLE_LEVELS = {
    student: 0,
    staff: 1,
    accountant: 2,
    manager: 3,
    admin: 4,
    "super-admin": 5,
};

const hasRole = (user, minRole) =>
    user && (ROLE_LEVELS[user.role] ?? -1) >= (ROLE_LEVELS[minRole] ?? 99);

// ── Token verification ──────────────────────────────────────────────────────
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password -refreshToken -verificationToken -walletPin");
            if (!req.user) return res.status(401).json({ message: "User not found" });
            next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
            }
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

// ── Role middleware factories ────────────────────────────────────────────────
const requireRole = (minRole) => (req, res, next) => {
    if (hasRole(req.user, minRole)) return next();
    res.status(403).json({
        message: `Access denied: requires ${minRole} or above (your role: ${req.user?.role || "none"})`,
    });
};

// Convenient named exports
const adminOnly = requireRole("admin");
const superAdminOnly = requireRole("super-admin");
const managerOrAbove = requireRole("manager");
const accountantOrAbove = requireRole("accountant");
const staffOrAbove = requireRole("staff");

// ── Canteen-scoped admin helper ─────────────────────────────────────────────
// Passes if user is super-admin OR the resource's canteen matches user's canteen
const canteenAdmin = (req, res, next) => {
    if (req.user?.role === "super-admin") return next();
    if (!["admin", "manager"].includes(req.user?.role)) {
        return res.status(403).json({ message: "Access denied: manager or admin required" });
    }
    next(); // Further canteen scoping handled inside controllers
};

// ── Audit log middleware factory ─────────────────────────────────────────────
const auditLog = (action, targetModel) => async (req, res, next) => {
    const original = res.json.bind(res);
    res.json = async (data) => {
        if (res.statusCode < 400 && req.user) {
            try {
                const targetId = req.params.id || data?._id || null;
                await AuditLog.create({
                    admin: req.user._id,
                    action,
                    targetModel,
                    targetId,
                    details: { method: req.method, body: req.body, ip: req.ip },
                });
            } catch (_) { /* Non-blocking */ }
        }
        return original(data);
    };
    next();
};

module.exports = {
    protect,
    hasRole,
    adminOnly,
    superAdminOnly,
    managerOrAbove,
    accountantOrAbove,
    staffOrAbove,
    canteenAdmin,
    auditLog,
};
