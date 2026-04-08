const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        subject: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ["order", "payment", "food-quality", "app-issue", "other"],
            default: "other",
        },
        status: {
            type: String,
            enum: ["open", "in-progress", "closed"],
            default: "open",
        },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", default: null },
        unreadByAdmin: { type: Number, default: 1 }, // badge count
        unreadByUser: { type: Number, default: 0 },
        // Escalation
        priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
        escalationLevel: { type: Number, default: 0 }, // 0=canteen, 1=admin, 2=management
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        escalatedAt: { type: Date, default: null },
        escalationReason: { type: String, default: null },
    },
    { timestamps: true }
);

const ticketMessageSchema = new mongoose.Schema(
    {
        ticket: { type: mongoose.Schema.Types.ObjectId, ref: "SupportTicket", required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true, trim: true },
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
const TicketMessage = mongoose.model("TicketMessage", ticketMessageSchema);

module.exports = { SupportTicket, TicketMessage };
