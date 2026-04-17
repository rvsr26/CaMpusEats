const express = require("express");
const router = express.Router();
const { protect, managerOrAbove } = require("../middleware/authMiddleware");
const { getPerformanceSummary, getItemPerformance } = require("../controllers/performanceController");

router.use(protect);
router.use(managerOrAbove);
router.get("/summary", getPerformanceSummary);
router.get("/items", getItemPerformance);

module.exports = router;
