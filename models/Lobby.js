const mongoose = require("mongoose");

const lobbyItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The user who added this item
});

const lobbySchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true }, // 6-digit code
        host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        cart: [lobbyItemSchema],
        status: {
            type: String,
            enum: ["open", "locked", "ordered", "cancelled"],
            default: "open",
        },
        finalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Lobby", lobbySchema);
