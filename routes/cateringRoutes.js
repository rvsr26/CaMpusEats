const express = require("express");
const router = express.Router();
const { requestEvent, getMyEvents, getAllEvents, updateEvent } = require("../controllers/cateringController");
const { protect, staffOrAbove } = require("../middleware/authMiddleware");

router.post("/", protect, requestEvent);
router.get("/my", protect, getMyEvents);
router.get("/all", protect, staffOrAbove, getAllEvents);
router.put("/:id", protect, staffOrAbove, updateEvent);

module.exports = router;
