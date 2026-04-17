const express = require("express");
const router = express.Router();
const { getDemandForecast } = require("../controllers/forecastController");
const { protect, accountantOrAbove } = require("../middleware/authMiddleware");

router.get("/", protect, accountantOrAbove, getDemandForecast);

module.exports = router;
