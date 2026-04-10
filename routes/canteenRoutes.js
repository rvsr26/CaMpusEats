const express = require("express");
const router = express.Router();
const { getCanteens, createCanteen, updateCanteen, deleteCanteen, assignManager, getCanteenTraffic } = require("../controllers/canteenController");
const { protect, adminOnly, superAdminOnly } = require("../middleware/authMiddleware");

router.get("/", getCanteens); // public
router.post("/", protect, adminOnly, createCanteen);
router.put("/:id", protect, adminOnly, updateCanteen);
router.delete("/:id", protect, adminOnly, deleteCanteen);
router.post("/:id/assign-manager", protect, adminOnly, assignManager);
router.get("/:id/traffic", getCanteenTraffic); // public

module.exports = router;
