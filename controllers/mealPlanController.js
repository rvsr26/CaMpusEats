const MealPlan = require("../models/MealPlan");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// @desc    Get user's active meal plans
// @route   GET /api/meal-plans
// @access  Private
exports.getMyMealPlans = async (req, res) => {
    try {
        const plans = await MealPlan.find({
            user: req.user.id,
            isActive: true,
            expiresAt: { $gt: new Date() }
        });
        res.status(200).json(plans);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// @desc    Purchase a meal plan
// @route   POST /api/meal-plans/purchase
// @access  Private
exports.purchaseMealPlan = async (req, res) => {
    try {
        const { planType } = req.body;

        // Define pricing and credits
        const plansInfo = {
            weekly: { price: 500, credits: 7, days: 7 }, // ~71 per meal
            monthly: { price: 2000, credits: 30, days: 30 } // ~66 per meal
        };

        if (!plansInfo[planType]) return res.status(400).json({ message: "Invalid plan type" });

        const plan = plansInfo[planType];
        const user = await User.findById(req.user.id);

        if (user.walletBalance < plan.price) {
            return res.status(400).json({ message: `Insufficient wallet balance. You need ₹${plan.price}.` });
        }

        // Deduct from wallet
        user.walletBalance -= plan.price;
        await user.save();

        await WalletTransaction.create({
            user: user._id,
            type: "debit",
            amount: plan.price,
            balanceAfter: user.walletBalance,
            description: `Purchased ${planType.charAt(0).toUpperCase() + planType.slice(1)} Meal Plan`
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.days);

        const newPlan = await MealPlan.create({
            user: user._id,
            planType,
            creditsTotal: plan.credits,
            expiresAt
        });

        res.status(201).json({ message: "Meal Plan activated successfully!", plan: newPlan });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
