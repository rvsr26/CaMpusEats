const express = require("express");
const router = express.Router();
const { getMyMealPlans, purchaseMealPlan } = require("../controllers/mealPlanController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyMealPlans);
router.post("/purchase", protect, purchaseMealPlan);

module.exports = router;
