const express = require("express");
const router = express.Router();
const { getMyNotifications, markAllRead, markOneRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);
router.put("/read", protect, markAllRead);
router.put("/:id/read", protect, markOneRead);

module.exports = router;
