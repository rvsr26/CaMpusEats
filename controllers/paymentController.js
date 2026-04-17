const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay credentials not configured");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// @desc   Create Razorpay order for wallet top-up
// @route  POST /api/payment/create-order
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body; // amount in rupees
        if (!amount || amount < 1) return res.status(400).json({ message: "Invalid amount" });

        const razorpay = getRazorpayInstance();
        const options = {
            amount: Math.round(amount * 100), // in paise
            currency: "INR",
            receipt: `wallet_${req.user._id}_${Date.now()}`,
            notes: { userId: req.user._id.toString(), type: "wallet_recharge" },
        };
        const order = await razorpay.orders.create(options);
        res.json({
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        logger.error("createRazorpayOrder error:", err.message);
        res.status(500).json({ message: err.message || "Payment gateway error" });
    }
};

// @desc   Verify Razorpay payment and credit wallet
// @route  POST /api/payment/verify
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

        // Verify HMAC signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        // Credit wallet
        const amountInRupees = Math.round(amount / 100);
        const user = await User.findById(req.user._id);
        user.walletBalance += amountInRupees;
        await user.save();

        await WalletTransaction.create({
            user: user._id,
            type: "credit",
            amount: amountInRupees,
            description: "Online recharge via Razorpay",
            balanceAfter: user.walletBalance,
            razorpayOrderId,
            razorpayPaymentId,
        });

        await Notification.create({
            user: user._id,
            title: "Wallet Recharged",
            message: `₹${amountInRupees} added via Razorpay. New balance: ₹${user.walletBalance}`,
            type: "wallet",
        });

        res.json({ message: "Payment verified and wallet credited!", balance: user.walletBalance });
    } catch (err) {
        logger.error("verifyRazorpayPayment error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get Razorpay key (for frontend)
// @route  GET /api/payment/key
const getRazorpayKey = (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID || "" });
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment, getRazorpayKey };
