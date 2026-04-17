const express = require("express");
const router = express.Router();
const { getRecommendations, getDemandPrediction } = require("../controllers/aiController");
const { protect, staffOrAbove } = require("../middleware/authMiddleware");

router.get("/recommendations", protect, getRecommendations);
router.get("/demand-prediction", protect, staffOrAbove, getDemandPrediction);

module.exports = router;
