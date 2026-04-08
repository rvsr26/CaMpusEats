const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
        mealPlan: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true },
        frequency: {
            type: String,
            enum: ["daily", "weekly", "monthly"],
            default: "daily",
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        nextRenewalDate: { type: Date, required: true },
        autoDebit: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ["active", "paused", "cancelled", "expired"],
            default: "active",
        },
        totalPaid: { type: Number, default: 0 },
        renewalCount: { type: Number, default: 0 },
        pausedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
