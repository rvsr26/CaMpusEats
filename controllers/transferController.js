const bcrypt = require("bcryptjs");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

// @desc   Set or update wallet PIN
// @route  POST /api/wallet/set-pin
const setWalletPin = async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({ message: "PIN must be exactly 4 digits (0–9)" });
        }
        const hashed = await bcrypt.hash(pin, 10);
        await User.findByIdAndUpdate(req.user._id, { walletPin: hashed });
        res.json({ message: "Wallet PIN set successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Check if wallet PIN is set
// @route  GET /api/wallet/pin-status
const getPinStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id, "walletPin");
        res.json({ hasPIN: !!user.walletPin });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Transfer wallet balance to another user
// @route  POST /api/wallet/transfer
const transferWallet = async (req, res) => {
    try {
        const { recipientEmail, amount, pin } = req.body;

        // Validations
        if (!recipientEmail || !amount || !pin) {
            return res.status(400).json({ message: "recipientEmail, amount, and PIN are required" });
        }
        if (amount < 1) return res.status(400).json({ message: "Minimum transfer is ₹1" });
        if (amount > 5000) return res.status(400).json({ message: "Maximum transfer per transaction is ₹5000" });

        const sender = await User.findById(req.user._id);

        // PIN check
        if (!sender.walletPin) {
            return res.status(400).json({ message: "Please set a wallet PIN first before transferring" });
        }
        const isPinValid = await bcrypt.compare(String(pin), sender.walletPin);
        if (!isPinValid) return res.status(401).json({ message: "Incorrect wallet PIN" });

        // Self-transfer check
        if (recipientEmail.toLowerCase() === sender.email.toLowerCase()) {
            return res.status(400).json({ message: "Cannot transfer to yourself" });
        }

        // Find recipient
        const recipient = await User.findOne({ email: recipientEmail.toLowerCase() });
        if (!recipient) return res.status(404).json({ message: "No user found with that email" });

        // Balance check
        if (sender.walletBalance < amount) {
            return res.status(400).json({ message: `Insufficient wallet balance. You have ₹${sender.walletBalance}` });
        }

        // Atomic debit + credit
        sender.walletBalance -= amount;
        recipient.walletBalance += amount;
        await Promise.all([sender.save(), recipient.save()]);

        const now = new Date();
        const txDescription = `Sent to ${recipient.name} (${recipient.email})`;
        const rxDescription = `Received from ${sender.name} (${sender.email})`;

        // Create transactions for both
        await Promise.all([
            WalletTransaction.create({
                user: sender._id,
                type: "debit",
                amount,
                description: txDescription,
                balanceAfter: sender.walletBalance,
                transferTo: recipient._id,
            }),
            WalletTransaction.create({
                user: recipient._id,
                type: "credit",
                amount,
                description: rxDescription,
                balanceAfter: recipient.walletBalance,
                transferFrom: sender._id,
            }),
        ]);

        // Notify recipient in real-time
        const io = req.app.get("io");
        const notif = await Notification.create({
            user: recipient._id,
            title: "💸 Money Received!",
            message: `${sender.name} sent you ₹${amount}. New balance: ₹${recipient.walletBalance}`,
            type: "wallet",
        });
        if (io) io.to(recipient._id.toString()).emit("notification", notif);

        res.json({
            message: `₹${amount} sent successfully to ${recipient.name}`,
            newBalance: sender.walletBalance,
        });
    } catch (err) {
        logger.error("transferWallet error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get transfer history for the current user
// @route  GET /api/wallet/transfer-history
const getTransferHistory = async (req, res) => {
    try {
        const txs = await WalletTransaction.find({
            user: req.user._id,
            $or: [
                { transferTo: { $ne: null } },
                { transferFrom: { $ne: null } },
            ],
        })
            .populate("transferTo", "name email")
            .populate("transferFrom", "name email")
            .sort({ createdAt: -1 })
            .limit(30);
        res.json(txs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { setWalletPin, getPinStatus, transferWallet, getTransferHistory };
