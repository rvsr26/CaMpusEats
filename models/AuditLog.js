const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        action: { type: String, required: true }, // e.g. "UPDATE_ORDER_STATUS", "DELETE_MENU_ITEM"
        targetModel: { type: String, required: true }, // "Order", "MenuItem", "User"
        targetId: { type: mongoose.Schema.Types.ObjectId },
        details: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

auditLogSchema.index({ admin: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
