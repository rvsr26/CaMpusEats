const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: "", maxlength: 500 },
    },
    { timestamps: true }
);

// One rating per order per user
ratingSchema.index({ user: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
