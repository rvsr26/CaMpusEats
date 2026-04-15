const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Notification = require("../models/Notification");

// @desc   Recharge user wallet (manual / admin credit)
// @route  POST /api/wallet/recharge
const rechargeWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }
        const user = await User.findById(req.user._id);
        user.walletBalance += Number(amount);
        await user.save();

        await WalletTransaction.create({
            user: user._id,
            type: "credit",
            amount: Number(amount),
            description: "Manual recharge",
            balanceAfter: user.walletBalance,
        });

        // Notify user
        await Notification.create({
            user: user._id,
            title: "Wallet Recharged",
            message: `₹${amount} added to your CampusEats wallet. New balance: ₹${user.walletBalance}`,
            type: "wallet",
        });

        res.json({ message: "Recharge successful", balance: user.walletBalance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get wallet balance
// @route  GET /api/wallet/balance
const getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ balance: user.walletBalance, loyaltyPoints: user.loyaltyPoints });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get wallet transaction history
// @route  GET /api/wallet/transactions
const getTransactions = async (req, res) => {
    try {
        const transactions = await WalletTransaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Redeem loyalty points (100 pts = ₹10)
// @route  POST /api/wallet/redeem-points
const redeemPoints = async (req, res) => {
    try {
        const { points } = req.body;
        if (!points || points < 100) {
            return res.status(400).json({ message: "Minimum 100 points required to redeem" });
        }
        const user = await User.findById(req.user._id);
        if (user.loyaltyPoints < points) {
            return res.status(400).json({ message: "Insufficient loyalty points" });
        }

        const cashValue = Math.floor(points / 100) * 10; // 100 pts = ₹10
        user.loyaltyPoints -= points;
        user.walletBalance += cashValue;
        await user.save();

        await WalletTransaction.create({
            user: user._id,
            type: "credit",
            amount: cashValue,
            description: `Redeemed ${points} loyalty points`,
            balanceAfter: user.walletBalance,
        });

        res.json({
            message: `${points} points redeemed for ₹${cashValue}!`,
            balance: user.walletBalance,
            loyaltyPoints: user.loyaltyPoints,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { rechargeWallet, getBalance, getTransactions, redeemPoints };
