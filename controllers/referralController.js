const User = require("../models/User");
const Notification = require("../models/Notification");
const { nanoid } = require("nanoid");
const logger = require("../utils/logger");

const REFERRAL_CREDIT = 50; // ₹50 credit for each successful referral

// @route  GET /api/referral/my  — get current user's referral info
const getMyReferral = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("referralCode referralCount referralCredits name email");
        if (!user) return res.status(404).json({ message: "User not found" });

        // If user doesn't have a referral code yet, generate one
        if (!user.referralCode) {
            user.referralCode = user.name.replace(/\s+/g, "").toUpperCase().slice(0, 5) + nanoid(4).toUpperCase();
            await user.save();
        }

        res.json({
            referralCode: user.referralCode,
            referralCount: user.referralCount || 0,
            referralCredits: user.referralCredits || 0,
            shareUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/register?ref=${user.referralCode}`,
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/referral/apply  — apply referral code during or after signup
const applyReferral = async (req, res) => {
    try {
        const { referralCode } = req.body;
        if (!referralCode) return res.status(400).json({ message: "Referral code is required" });

        if (req.user.referredBy) return res.status(409).json({ message: "You have already used a referral code" });

        const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        if (!referrer) return res.status(404).json({ message: "Invalid referral code" });
        if (referrer._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot use your own referral code" });
        }

        // Credit both users
        await User.findByIdAndUpdate(req.user._id, {
            referredBy: referrer._id,
            $inc: { walletBalance: REFERRAL_CREDIT, referralCredits: REFERRAL_CREDIT },
        });

        await User.findByIdAndUpdate(referrer._id, {
            $inc: { referralCount: 1, walletBalance: REFERRAL_CREDIT, referralCredits: REFERRAL_CREDIT },
        });

        // Notifications
        const refereeNotif = await Notification.create({
            user: req.user._id,
            title: "🎁 Referral Bonus!",
            message: `You earned ₹${REFERRAL_CREDIT} for using ${referrer.name}'s referral code!`,
            type: "system",
        });
        const referrerNotif = await Notification.create({
            user: referrer._id,
            title: "🎉 Referral Reward!",
            message: `${req.user.name} used your referral code! You earned ₹${REFERRAL_CREDIT}!`,
            type: "system",
        });

        const io = req.app.get("io");
        if (io) {
            io.to(req.user._id.toString()).emit("notification", refereeNotif);
            io.to(referrer._id.toString()).emit("notification", referrerNotif);
        }

        res.json({ message: `₹${REFERRAL_CREDIT} added to your wallet!`, creditsEarned: REFERRAL_CREDIT });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/referral/leaderboard  — top referrers
const getLeaderboard = async (req, res) => {
    try {
        const top = await User.find({ referralCount: { $gt: 0 } })
            .select("name referralCount referralCredits")
            .sort({ referralCount: -1 })
            .limit(10);
        res.json(top);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getMyReferral, applyReferral, getLeaderboard };
