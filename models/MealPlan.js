const mongoose = require("mongoose");

const mealPlanSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        planType: { type: String, enum: ["weekly", "monthly"], required: true },
        creditsTotal: { type: Number, required: true },
        creditsUsed: { type: Number, default: 0 },
        expiresAt: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MealPlan", mealPlanSchema);
