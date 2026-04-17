const express = require("express");
const router = express.Router();
const { exportUserData, deleteAccount } = require("../controllers/exportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/export", protect, exportUserData);
router.delete("/account", protect, deleteAccount);

module.exports = router;
