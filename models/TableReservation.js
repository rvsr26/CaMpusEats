const mongoose = require("mongoose");

const tableReservationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
        tableNumber: { type: String, default: null }, // assigned by canteen staff
        date: { type: Date, required: true },
        timeSlot: { type: String, required: true }, // e.g. "12:00-12:30"
        partySize: { type: Number, required: true, min: 1, max: 20 },
        specialRequests: { type: String, default: "" },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
            default: "pending",
        },
        confirmationCode: { type: String },
        reminderSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TableReservation", tableReservationSchema);
