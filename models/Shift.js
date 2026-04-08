const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
    {
        staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
        date: { type: Date, required: true },
        startTime: { type: String, required: true }, // "09:00"
        endTime: { type: String, required: true },   // "17:00"
        role: {
            type: String,
            enum: ["cashier", "cook", "cleaner", "supervisor", "server"],
            default: "server",
        },
        status: {
            type: String,
            enum: ["scheduled", "ongoing", "completed", "absent", "swapped"],
            default: "scheduled",
        },
        clockInAt: { type: Date, default: null },
        clockOutAt: { type: Date, default: null },
        notes: { type: String, default: "" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Shift", shiftSchema);
