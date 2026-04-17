const express = require("express");
const router = express.Router();
const { getFrequentlyBoughtTogether, getReorderSuggestions, getTrendingItems } = require("../controllers/recommendationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/trending", getTrendingItems);           // public
router.get("/reorder", protect, getReorderSuggestions); // logged-in user
router.get("/", protect, getFrequentlyBoughtTogether);  // logged-in user, pass ?itemId=

module.exports = router;
