const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getMealPlans,
    subscribe,
    getMySubscriptions,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
} = require("../controllers/subscriptionController");

router.get("/plans", protect, getMealPlans);
router.use(protect);
router.get("/", getMySubscriptions);
router.post("/", subscribe);
router.put("/:id/pause", pauseSubscription);
router.put("/:id/resume", resumeSubscription);
router.put("/:id/cancel", cancelSubscription);

module.exports = router;
