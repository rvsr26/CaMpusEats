const mongoose = require("mongoose");

const queueTokenSchema = new mongoose.Schema(
    {
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        tokenNumber: { type: Number, required: true },
        status: {
            type: String,
            enum: ["waiting", "called", "done", "skipped"],
            default: "waiting",
        },
        estimatedWaitMins: { type: Number, default: 0 },
        calledAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        date: { type: Date, default: Date.now }, // for daily reset
    },
    { timestamps: true }
);

// Compound index: canteen + tokenNumber + date is unique per day
queueTokenSchema.index({ canteen: 1, tokenNumber: 1, date: 1 });

module.exports = mongoose.model("QueueToken", queueTokenSchema);
