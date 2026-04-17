const express = require("express");
const router = express.Router();
const { getAggregatedOrders } = require("../controllers/kdsController");
const { protect, staffOrAbove } = require("../middleware/authMiddleware");

router.get("/aggregate", protect, staffOrAbove, getAggregatedOrders);

module.exports = router;
