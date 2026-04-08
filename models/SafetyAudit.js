const mongoose = require("mongoose");

const safetyAuditSchema = new mongoose.Schema(
    {
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
        auditor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["Temperature Check", "Cleanliness", "Inventory Expiry", "Water Quality", "Staff Hygiene"],
            required: true
        },
        itemsInspected: { type: String },
        status: { type: String, enum: ["pass", "fail", "rectification required"], required: true },
        notes: { type: String },
        actionTaken: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SafetyAudit", safetyAuditSchema);
