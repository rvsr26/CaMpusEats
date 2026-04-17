const express = require("express");
const router = express.Router();
const { getSummary, getPeakHours, exportData, getAuditLog } = require("../controllers/analyticsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/summary", protect, adminOnly, getSummary);
router.get("/peak-hours", protect, adminOnly, getPeakHours);
router.get("/export", protect, adminOnly, exportData);
router.get("/audit-log", protect, adminOnly, getAuditLog);

module.exports = router;
