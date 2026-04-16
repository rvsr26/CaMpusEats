const { SupportTicket, TicketMessage } = require("../models/SupportTicket");
const Notification = require("../models/Notification");
const { hasRole } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

// @route  POST /api/support   — student creates ticket
const createTicket = async (req, res) => {
    try {
        const { subject, category, message, orderId } = req.body;
        if (!subject || !message) return res.status(400).json({ message: "Subject and message required" });

        const ticket = await SupportTicket.create({
            user: req.user._id,
            subject, category,
            orderId: orderId || null,
        });

        await TicketMessage.create({
            ticket: ticket._id,
            sender: req.user._id,
            message,
            isAdmin: false,
        });

        await ticket.populate("user", "name email");
        res.status(201).json(ticket);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/support   — student: own tickets | staff+: all tickets
const getTickets = async (req, res) => {
    try {
        const isStaff = hasRole(req.user, "staff");
        const filter = isStaff ? {} : { user: req.user._id };
        const { status, category } = req.query;
        if (status) filter.status = status;
        if (category) filter.category = category;

        const tickets = await SupportTicket.find(filter)
            .populate("user", "name email")
            .populate("orderId", "tokenNumber totalAmount")
            .sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/support/:id/messages
const getTicketMessages = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        // Only ticket owner or staff can view
        const isOwner = ticket.user.toString() === req.user._id.toString();
        if (!isOwner && !hasRole(req.user, "staff")) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Mark as read
        if (hasRole(req.user, "staff")) {
            await SupportTicket.findByIdAndUpdate(req.params.id, { unreadByAdmin: 0 });
        } else {
            await SupportTicket.findByIdAndUpdate(req.params.id, { unreadByUser: 0 });
        }

        const messages = await TicketMessage.find({ ticket: req.params.id })
            .populate("sender", "name role")
            .sort({ createdAt: 1 });
        res.json({ ticket, messages });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/support/:id/messages  — reply
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message?.trim()) return res.status(400).json({ message: "Message is required" });

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const isOwner = ticket.user.toString() === req.user._id.toString();
        const isStaff = hasRole(req.user, "staff");
        if (!isOwner && !isStaff) return res.status(403).json({ message: "Not authorized" });

        const msg = await TicketMessage.create({
            ticket: ticket._id,
            sender: req.user._id,
            message: message.trim(),
            isAdmin: isStaff,
        });

        // Update ticket status + unread counter
        const update = { status: "in-progress" };
        if (isStaff) update.unreadByUser = (ticket.unreadByUser || 0) + 1;
        else update.unreadByAdmin = (ticket.unreadByAdmin || 0) + 1;
        await SupportTicket.findByIdAndUpdate(req.params.id, update);

        // Notify the other party
        const notifyUserId = isStaff ? ticket.user : null; // notify student
        if (notifyUserId) {
            const notif = await Notification.create({
                user: notifyUserId,
                title: "💬 Support Reply",
                message: `Support team replied to your ticket: "${ticket.subject}"`,
                type: "system",
            });
            const io = req.app.get("io");
            if (io) io.to(notifyUserId.toString()).emit("notification", notif);
        }

        await msg.populate("sender", "name role");
        res.status(201).json(msg);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/support/:id/close  — staff+
const closeTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id, { status: "closed" }, { new: true }
        ).populate("user", "name email");
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.json(ticket);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/support/stats  — staff+
const getTicketStats = async (req, res) => {
    try {
        const [open, inProgress, closed] = await Promise.all([
            SupportTicket.countDocuments({ status: "open" }),
            SupportTicket.countDocuments({ status: "in-progress" }),
            SupportTicket.countDocuments({ status: "closed" }),
        ]);
        res.json({ open, inProgress, closed, total: open + inProgress + closed });
    } catch (err) { res.status(500).json({ message: err.message }); }
};


// @route  PUT /api/support/:id/escalate  — admin escalates a ticket
const escalateTicket = async (req, res) => {
    try {
        const { escalationReason, assignedTo, priority } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        if (!hasRole(req.user, "staff")) return res.status(403).json({ message: "Staff access required" });

        const maxLevel = 2;
        const newLevel = Math.min((ticket.escalationLevel || 0) + 1, maxLevel);

        const update = {
            escalationLevel: newLevel,
            escalatedAt: new Date(),
            escalationReason: escalationReason || `Escalated by ${req.user.name}`,
            status: "in-progress",
        };
        if (assignedTo) update.assignedTo = assignedTo;
        if (priority) update.priority = priority;

        const updated = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
            .populate("user", "name email")
            .populate("assignedTo", "name email role");

        const io = req.app.get("io");
        if (updated.assignedTo && io) {
            const notif = await Notification.create({
                user: updated.assignedTo._id,
                title: "📋 Ticket Assigned",
                message: `You have been assigned a support ticket: "${updated.subject}" (Level ${newLevel})`,
                type: "system",
            });
            io.to(updated.assignedTo._id.toString()).emit("notification", notif);
        }

        res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createTicket, getTickets, getTicketMessages, sendMessage, closeTicket, getTicketStats, escalateTicket };
