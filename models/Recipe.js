const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
    {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true, unique: true },
        ingredients: [
            {
                ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
                qty: { type: Number, required: true, min: 0 }, // qty consumed per 1 portion
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
