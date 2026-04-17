const express = require("express");
const router = express.Router();
const { protect, staffOrAbove } = require("../middleware/authMiddleware");
const { issueToken, getQueue, getTokenStatus, advanceQueue } = require("../controllers/queueController");

// Public — anyone can view the queue display
router.get("/", getQueue);

router.use(protect);
router.post("/issue/:orderId", issueToken);
router.get("/status/:orderId", getTokenStatus);
router.put("/:id/advance", staffOrAbove, advanceQueue);

module.exports = router;
