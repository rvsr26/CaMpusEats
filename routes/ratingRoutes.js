const express = require("express");
const router = express.Router();
const { submitRating, getItemRatings } = require("../controllers/ratingController");
const { protect } = require("../middleware/authMiddleware");
const { validateRating } = require("../middleware/validationMiddleware");

router.post("/", protect, validateRating, submitRating);
router.get("/:menuItemId", getItemRatings);

module.exports = router;
