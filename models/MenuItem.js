const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        station: {
            type: String,
            default: "General",
            trim: true,
        },
        price: { type: Number, required: true, min: 0 },
        basePrice: { type: Number, min: 0 }, // For dynamic pricing original reference
        image: { type: String, default: "" },
        description: { type: String, default: "" },
        availability: { type: Boolean, default: true },
        isVeg: { type: Boolean, default: true },
        preparationTime: { type: Number, default: 10 }, // minutes
        stockQuantity: { type: Number, default: 999 },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", default: null },
        // Ratings (aggregated)
        avgRating: { type: Number, default: 0, min: 0, max: 5 },
        ratingCount: { type: Number, default: 0 },
        // Scheduled availability
        availableFrom: { type: Date, default: null },
        availableTo: { type: Date, default: null },
        carbonScore: { type: Number, default: 5 }, // 1-10 (10 is most sustainable)
        carbonSaving: { type: Number, default: 0.2 }, // kg of CO2 saved vs meat alternative
        isPerishable: { type: Boolean, default: false }, // For dynamic pricing
        tags: [{ type: String, trim: true }], // For content-based recommendations
    },
    { timestamps: true }
);

// Text index for search
menuItemSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("MenuItem", menuItemSchema);
