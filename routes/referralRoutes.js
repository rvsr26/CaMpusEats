const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getMyReferral, applyReferral, getLeaderboard } = require("../controllers/referralController");

router.use(protect);
router.get("/my", getMyReferral);
router.post("/apply", applyReferral);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
