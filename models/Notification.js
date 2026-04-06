const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { type: String, enum: ["order", "wallet", "promo", "system"], default: "order" },
        isRead: { type: Boolean, default: false },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
