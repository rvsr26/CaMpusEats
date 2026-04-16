const express = require("express");
const router = express.Router();
const { createTicket, getTickets, getTicketMessages, sendMessage, closeTicket, getTicketStats, escalateTicket } = require("../controllers/supportController");
const { protect, staffOrAbove } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/stats", staffOrAbove, getTicketStats);
router.post("/", createTicket);
router.get("/", getTickets);
router.get("/:id/messages", getTicketMessages);
router.post("/:id/messages", sendMessage);
router.put("/:id/close", staffOrAbove, closeTicket);
router.put("/:id/escalate", staffOrAbove, escalateTicket);

module.exports = router;
