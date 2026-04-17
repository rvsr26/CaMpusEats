const express = require("express");
const router = express.Router();
const { getDynamicDiscounts, applyDynamicPrices } = require("../controllers/pricingController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/:canteenId", getDynamicDiscounts);
router.post("/apply", protect, adminOnly, applyDynamicPrices);

module.exports = router;
