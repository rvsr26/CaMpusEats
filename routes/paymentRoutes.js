const express = require("express");
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment, getRazorpayKey } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

router.get("/key", protect, getRazorpayKey);
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);

module.exports = router;
