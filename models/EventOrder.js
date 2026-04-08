const mongoose = require("mongoose");

const eventOrderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        eventName: { type: String, required: true },
        eventDate: { type: Date, required: true },
        guestCount: { type: Number, required: true },
        location: { type: String, required: true },
        itemsRequested: { type: String, required: true }, // comma separated or text description
        status: {
            type: String,
            enum: ["pending", "reviewed", "approved", "rejected", "completed"],
            default: "pending"
        },
        quotedPrice: { type: Number, default: 0 },
        adminNotes: { type: String },
        contactPhone: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EventOrder", eventOrderSchema);
