const Subscription = require("../models/Subscription");
const MealPlan = require("../models/MealPlan");
const User = require("../models/User");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

// @route  GET /api/subscriptions/plans  — list available meal plans
const getMealPlans = async (req, res) => {
    try {
        const plans = await MealPlan.find({ isActive: true }).populate("canteen", "name location");
        res.json(plans);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/subscriptions  — subscribe to a meal plan
const subscribe = async (req, res) => {
    try {
        const { mealPlanId, canteen, frequency = "weekly", startDate, autoDebit = true } = req.body;
        if (!mealPlanId || !canteen) {
            return res.status(400).json({ message: "Meal plan and canteen are required" });
        }

        const plan = await MealPlan.findById(mealPlanId);
        if (!plan) return res.status(404).json({ message: "Meal plan not found" });

        // Check user already has active subscription to this plan
        const existing = await Subscription.findOne({
            user: req.user._id,
            mealPlan: mealPlanId,
            status: "active",
        });
        if (existing) return res.status(409).json({ message: "Already subscribed to this plan" });

        const start = startDate ? new Date(startDate) : new Date();
        const nextRenewal = new Date(start);
        if (frequency === "weekly") nextRenewal.setDate(nextRenewal.getDate() + 7);
        else nextRenewal.setDate(nextRenewal.getDate() + 1);

        // Check wallet balance for auto-debit
        if (autoDebit) {
            const planPrice = plan.price || 0;
            const user = await User.findById(req.user._id);
            if (user.walletBalance < planPrice) {
                return res.status(402).json({ message: "Insufficient wallet balance for auto-debit" });
            }
            user.walletBalance -= planPrice;
            await user.save();
        }

        const subscription = await Subscription.create({
            user: req.user._id,
            canteen,
            mealPlan: mealPlanId,
            frequency,
            startDate: start,
            nextRenewalDate: nextRenewal,
            autoDebit,
        });
        await subscription.populate("mealPlan canteen", "name price location");

        await Notification.create({
            user: req.user._id,
            title: "🍱 Subscription Activated!",
            message: `Your ${plan.name || "meal plan"} subscription is now active!`,
            type: "system",
        });

        res.status(201).json(subscription);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/subscriptions  — my subscriptions
const getMySubscriptions = async (req, res) => {
    try {
        const subs = await Subscription.find({ user: req.user._id })
            .populate("mealPlan", "name price description items")
            .populate("canteen", "name location")
            .sort({ createdAt: -1 });
        res.json(subs);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/subscriptions/:id/pause
const pauseSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
        if (!sub) return res.status(404).json({ message: "Subscription not found" });
        if (sub.status !== "active") return res.status(400).json({ message: "Subscription is not active" });
        sub.status = "paused";
        await sub.save();
        res.json(sub);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/subscriptions/:id/resume
const resumeSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
        if (!sub) return res.status(404).json({ message: "Subscription not found" });
        if (sub.status !== "paused") return res.status(400).json({ message: "Subscription is not paused" });
        sub.status = "active";
        // Reset next renewal relative to now
        const nextRenewal = new Date();
        if (sub.frequency === "weekly") nextRenewal.setDate(nextRenewal.getDate() + 7);
        else nextRenewal.setDate(nextRenewal.getDate() + 1);
        sub.nextRenewalDate = nextRenewal;
        await sub.save();
        res.json(sub);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/subscriptions/:id/cancel
const cancelSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
        if (!sub) return res.status(404).json({ message: "Subscription not found" });
        sub.status = "cancelled";
        sub.endDate = new Date();
        await sub.save();
        res.json({ message: "Subscription cancelled", subscription: sub });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Called by cronJobs — process subscriptions due for renewal
const processRenewals = async (io) => {
    try {
        const now = new Date();
        const dueSubs = await Subscription.find({
            status: "active",
            autoDebit: true,
            nextRenewalDate: { $lte: now },
        }).populate("mealPlan user");

        for (const sub of dueSubs) {
            const planPrice = sub.mealPlan?.price || 0;
            const user = await User.findById(sub.user._id);
            if (user && user.walletBalance >= planPrice) {
                user.walletBalance -= planPrice;
                await user.save();

                const nextRenewal = new Date();
                if (sub.frequency === "weekly") nextRenewal.setDate(nextRenewal.getDate() + 7);
                else nextRenewal.setDate(nextRenewal.getDate() + 1);
                sub.nextRenewalDate = nextRenewal;
                await sub.save();

                const notif = await Notification.create({
                    user: sub.user._id,
                    title: "🔄 Subscription Renewed",
                    message: `Your meal plan has been renewed. ₹${planPrice} deducted from wallet.`,
                    type: "system",
                });
                if (io) io.to(sub.user._id.toString()).emit("notification", notif);
                logger.info(`Subscription ${sub._id} renewed for user ${sub.user.name}`);
            } else {
                sub.status = "paused";
                await sub.save();
                const notif = await Notification.create({
                    user: sub.user._id,
                    title: "⚠️ Subscription Paused",
                    message: "Insufficient wallet balance. Your meal plan subscription has been paused.",
                    type: "system",
                });
                if (io) io.to(sub.user._id.toString()).emit("notification", notif);
            }
        }
    } catch (err) { logger.error("Subscription renewal error:", err.message); }
};

module.exports = { getMealPlans, subscribe, getMySubscriptions, pauseSubscription, resumeSubscription, cancelSubscription, processRenewals };
