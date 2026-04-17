const QueueToken = require("../models/QueueToken");
const Order = require("../models/Order");
const { hasRole } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

// @route  POST /api/queue/issue/:orderId  — issue queue token on order creation
const issueToken = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate("canteen");
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Check if token already exists
        const existing = await QueueToken.findOne({ order: order._id });
        if (existing) return res.json(existing);

        // Get next token number for this canteen today
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const count = await QueueToken.countDocuments({
            canteen: order.canteen,
            createdAt: { $gte: today },
        });

        const tokenNumber = count + 1;
        const estimatedWaitMins = tokenNumber * 3; // 3 min per order estimate

        const token = await QueueToken.create({
            order: order._id,
            canteen: order.canteen,
            tokenNumber,
            estimatedWaitMins,
        });

        const io = req.app.get("io");
        if (io) io.to(`canteen-${order.canteen}`).emit("queue:update", { tokenNumber, action: "add" });

        res.status(201).json(token);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/queue  — get live queue for a canteen
const getQueue = async (req, res) => {
    try {
        const { canteen } = req.query;
        if (!canteen) return res.status(400).json({ message: "canteen query param required" });

        const queue = await QueueToken.find({
            canteen,
            status: { $in: ["waiting", "called"] },
        })
            .populate("order", "tokenNumber user items")
            .sort({ tokenNumber: 1 });
        res.json(queue);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/queue/status/:orderId  — get token for a specific order
const getTokenStatus = async (req, res) => {
    try {
        const token = await QueueToken.findOne({ order: req.params.orderId });
        if (!token) return res.status(404).json({ message: "Queue token not found" });

        // Calculate position
        const position = await QueueToken.countDocuments({
            canteen: token.canteen,
            status: "waiting",
            tokenNumber: { $lte: token.tokenNumber },
        });

        res.json({ ...token.toObject(), position });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/queue/:id/advance  — staff calls next / marks done
const advanceQueue = async (req, res) => {
    try {
        if (!hasRole(req.user, "staff")) {
            return res.status(403).json({ message: "Staff access required" });
        }

        const { status } = req.body; // "called" or "done"
        const token = await QueueToken.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate("order", "tokenNumber user");

        if (!token) return res.status(404).json({ message: "Token not found" });

        const io = req.app.get("io");
        if (io) {
            io.to(`canteen-${token.canteen}`).emit("queue:update", {
                tokenNumber: token.tokenNumber,
                status,
                action: "update",
            });
            // Notify the user directly
            if (status === "called" && token.order?.user) {
                io.to(token.order.user.toString()).emit("queue:called", {
                    tokenNumber: token.tokenNumber,
                    message: "Your order is ready! Please collect at the counter.",
                });
            }
        }

        res.json(token);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { issueToken, getQueue, getTokenStatus, advanceQueue };
