const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        guestName: { type: String, default: null }, // For kiosk/walk-up orders
        guestPhone: { type: String, default: null },
        items: [orderItemSchema],
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["scheduled", "pending", "accepted", "preparing", "ready", "completed", "cancelled"],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: ["unpaid", "paid", "refunded"],
            default: "unpaid",
        },
        paymentMethod: {
            type: String,
            enum: ["UPI", "Card", "Wallet", "Cash", "Meal Credit"],
            default: "Cash",
        },
        tokenNumber: { type: Number },
        pickupTime: { type: Date },
        scheduledTime: { type: Date }, // Feature 6: Pre-ordering
        tableNumber: { type: String },
        transactionId: { type: String, default: "" },
        notes: { type: String },
        blockHash: { type: String },
        prevHash: { type: String },
        orderType: { type: String, enum: ["dining", "takeaway"], default: "takeaway" }, // dining = dine in, takeaway = pick up
        deliveryMode: { type: String, enum: ["pickup", "delivery"], default: "pickup" },
        deliveryLocation: { type: String },
        deliveryFee: { type: Number, default: 0 },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", default: null },
        placedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // POS cashier
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
