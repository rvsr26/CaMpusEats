const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true }, // e.g. "Burger Bun"
        unit: { type: String, enum: ["pcs", "kg", "g", "ml", "L"], default: "pcs" },
        stockQty: { type: Number, required: true, default: 0, min: 0 },
        lowStockThreshold: { type: Number, default: 10 }, // alert when below this
        costPerUnit: { type: Number, default: 0 }, // for cost tracking
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Ingredient", ingredientSchema);
