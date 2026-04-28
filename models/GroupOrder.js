const mongoose = require("mongoose");

const participantItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
});

const participantSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: "" },
    items: [participantItemSchema],
    subTotal: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
});

const groupOrderSchema = new mongoose.Schema(
    {
        host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
        shareCode: { type: String, required: true, unique: true },
        participants: [participantSchema],
        totalAmount: { type: Number, default: 0 },
        splitMethod: {
            type: String,
            enum: ["itemized", "equal"],
            default: "itemized",
        },
        status: {
            type: String,
            enum: ["open", "locked", "placed", "cancelled"],
            default: "open",
        },
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
        expiresAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("GroupOrder", groupOrderSchema);
