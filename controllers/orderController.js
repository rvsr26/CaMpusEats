const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const MenuItem = require("../models/MenuItem");
const Notification = require("../models/Notification");
const WalletTransaction = require("../models/WalletTransaction");
const logger = require("../utils/logger");
const crypto = require("crypto");
const { deductIngredients, restoreIngredients } = require("./inventoryController");

// Generate daily sequential token number
const getDailyToken = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await Order.countDocuments({ createdAt: { $gte: today } });
    return count + 1;
};

// Helper: create notification and emit socket event
const notify = async (io, userId, title, message, type, orderId) => {
    try {
        const notif = await Notification.create({ user: userId, title, message, type, orderId });
        io.to(userId.toString()).emit("notification", notif);
    } catch (err) {
        logger.warn("Notification creation failed:", err.message);
    }
};

// @desc   Create new order from cart
// @route  POST /api/orders/create
const createOrder = async (req, res) => {
    try {
        const { paymentMethod, notes, scheduledTime, tableNumber, deliveryMode, deliveryLocation, deliveryFee, orderType } = req.body;
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.menuItem");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        const totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const pickupTime = new Date(Date.now() + 20 * 60 * 1000);

        const orderItems = cart.items.map((i) => ({
            menuItem: i.menuItem._id,
            name: i.menuItem.name,
            price: i.price,
            quantity: i.quantity,
        }));

        const isScheduled = !!(scheduledTime && new Date(scheduledTime) > new Date());
        let tokenNumber = null;
        if (!isScheduled) tokenNumber = await getDailyToken();

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            totalAmount,
            paymentMethod: paymentMethod || "Cash",
            paymentStatus: paymentMethod === "Wallet" ? "paid" : (paymentMethod && paymentMethod !== "Cash" ? "paid" : "unpaid"),
            status: isScheduled ? "scheduled" : "pending",
            tokenNumber,
            scheduledTime: isScheduled ? new Date(scheduledTime) : undefined,
            tableNumber: tableNumber || "",
            pickupTime: !isScheduled ? new Date(Date.now() + 20 * 60 * 1000) : undefined,
            notes: notes || "",
            orderType: orderType || "takeaway",
            deliveryMode: deliveryMode || "pickup",
            deliveryLocation: deliveryLocation || "",
            deliveryFee: deliveryFee || 0
        });

        // Wallet Logic
        if (paymentMethod === "Wallet") {
            const user = await User.findById(req.user._id);
            if (user.walletBalance < totalAmount) {
                await Order.findByIdAndDelete(order._id);
                return res.status(400).json({ message: "Insufficient wallet balance" });
            }
            user.walletBalance -= totalAmount;

            // Loyalty points: 1 point per ₹10
            const pointsEarned = Math.floor(totalAmount / 10);
            user.loyaltyPoints += pointsEarned;
            await user.save();

            // Record transaction
            await WalletTransaction.create({
                user: user._id,
                type: "debit",
                amount: totalAmount,
                description: `Order #${tokenNumber}`,
                balanceAfter: user.walletBalance,
            });
        } else if (paymentMethod === "Meal Credit") {
            const MealPlan = require("../models/MealPlan");
            const activePlans = await MealPlan.find({
                user: req.user._id,
                isActive: true,
                expiresAt: { $gt: new Date() }
            });

            // Check if user has any active plan with remaining credits
            const usablePlan = activePlans.find(plan => plan.creditsTotal > plan.creditsUsed);
            if (!usablePlan) {
                await Order.findByIdAndDelete(order._id);
                return res.status(400).json({ message: "No active meal plans with available credits" });
            }

            // Deduct 1 credit
            usablePlan.creditsUsed += 1;
            if (usablePlan.creditsUsed >= usablePlan.creditsTotal) {
                usablePlan.isActive = false; // Mark as exhausted
            }
            await usablePlan.save();
        }

        // Clear cart after order
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
        await order.populate("user", "name email");

        const io = req.app.get("io");

        if (!isScheduled) {
            // Decrement menu item stock quantity
            for (const item of cart.items) {
                await MenuItem.findByIdAndUpdate(item.menuItem._id, {
                    $inc: { stockQuantity: -item.quantity }
                });
            }

            // Deduct raw ingredients from warehouse (non-blocking)
            deductIngredients(orderItems, io).catch((e) => logger.warn("ingredient deduction:", e.message));

            // Notify Admins via socket
            io.emit("newOrder", order);

            // Notify student
            await notify(
                io, req.user._id,
                "Order Placed",
                `Order #${tokenNumber} placed successfully! Estimated pickup in 20 min.`,
                "order", order._id
            );
        } else {
            // Notify student about successful scheduling
            await notify(
                io, req.user._id,
                "Pre-Order Scheduled",
                `Your order is scheduled for ${new Date(scheduledTime).toLocaleString()}.`,
                "order", order._id
            );
        }

        // Simulated Blockchain "Mining"
        const lastOrder = await Order.findOne({ blockHash: { $ne: null } }).sort({ createdAt: -1 });
        const prevHash = lastOrder ? lastOrder.blockHash : "00000000000000000";
        const blockContent = `${order._id}${order.totalAmount}${prevHash}${Date.now()}`;
        const hash = crypto.createHash("sha256").update(blockContent).digest("hex");

        order.blockHash = "0x" + hash;
        order.prevHash = prevHash;
        await order.save();

        res.status(201).json(order);
    } catch (err) {
        logger.error("createOrder error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get orders for logged-in student
// @route  GET /api/orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get all orders (Admin)
// @route  GET /api/orders/all
const getAllOrders = async (req, res) => {
    try {
        const { status, date } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (date) {
            const day = new Date(date);
            day.setHours(0, 0, 0, 0);
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            filter.createdAt = { $gte: day, $lt: next };
        }
        const orders = await Order.find(filter).populate("user", "name email phone").sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get single order by ID
// @route  GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email phone");
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get Queue Status of an Order
// @route  GET /api/orders/:id/queue-status
const getOrderQueueStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // If order is not pending or accepted or preparing, it's not in the active queue
        if (!["pending", "accepted", "preparing"].includes(order.status)) {
            return res.json({
                orderId: order._id,
                status: order.status,
                position: 0,
                estimatedWait: 0
            });
        }

        // Count active orders created BEFORE this one
        const activeOrdersAhead = await Order.countDocuments({
            status: { $in: ["pending", "accepted", "preparing"] },
            createdAt: { $lt: order.createdAt }
        });

        // Current position in queue (0 means they are next)
        const position = activeOrdersAhead + 1;

        // Estimated wait time: Let's assume on average each order takes 2-3 minutes
        // We can do a simple heuristic: position * 2.5 minutes
        const estimatedWait = Math.ceil(position * 2.5);

        res.json({
            orderId: order._id,
            status: order.status,
            position,
            estimatedWait,
            message: `You are #${position} in line. Estimated prep time: ${estimatedWait} mins.`
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Update order status (Admin)
// @route  PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        await order.save();
        await order.populate("user", "name email phone");

        const io = req.app.get("io");
        io.to(order.user._id.toString()).emit("orderUpdate", order);

        // Notification messages
        const statusMsg = {
            accepted: "Your order has been accepted! 👨‍🍳",
            preparing: "Your food is being prepared! 🍳",
            ready: `Token #${order.tokenNumber} is ready for pickup! 🎉`,
            completed: "Order complete. Enjoy your meal! 😋",
            cancelled: `Order #${order.tokenNumber} has been cancelled.`,
        };

        await notify(
            io, order.user._id,
            `Order ${status?.charAt(0).toUpperCase() + status?.slice(1) || "Updated"}`,
            statusMsg[status] || `Order status changed to ${status}`,
            "order", order._id
        );

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Cancel order (Student) — with wallet refund
// @route  PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        if (!["pending"].includes(order.status)) {
            return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
        }

        order.status = "cancelled";
        await order.save();

        // 💰 WALLET REFUND — bug fix
        if (order.paymentMethod === "Wallet" && order.paymentStatus === "paid") {
            const user = await User.findById(req.user._id);
            user.walletBalance += order.totalAmount;
            await user.save();

            order.paymentStatus = "refunded";
            await order.save();

            await WalletTransaction.create({
                user: user._id,
                type: "credit",
                amount: order.totalAmount,
                description: `Refund for Order #${order.tokenNumber}`,
                balanceAfter: user.walletBalance,
            });
        }

        // Restore raw ingredients back to warehouse
        restoreIngredients(order.items).catch((e) => logger.warn("ingredient restore:", e.message));

        const io = req.app.get("io");
        io.emit("orderUpdate", order);

        await notify(
            io, req.user._id,
            "Order Cancelled",
            `Order #${order.tokenNumber} cancelled.${order.paymentMethod === "Wallet" ? ` ₹${order.totalAmount} refunded.` : ""}`,
            "order", order._id
        );

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Create guest order (kiosk / walk-up – no auth required)
// @route  POST /api/orders/guest
const createGuestOrder = async (req, res) => {
    try {
        const { items, guestName, guestPhone, tableNumber, orderType, notes, canteenId } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in order" });
        }

        // Validate and fetch menu items
        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem) return res.status(404).json({ message: `Item ${item.menuItemId} not found` });
            const lineTotal = menuItem.price * item.quantity;
            totalAmount += lineTotal;
            orderItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
            });
        }

        const tokenNumber = await getDailyToken();

        const order = await Order.create({
            user: null,
            guestName: guestName || "Walk-in Guest",
            guestPhone: guestPhone || "",
            items: orderItems,
            totalAmount,
            paymentMethod: "Cash",
            paymentStatus: "unpaid",
            status: "pending",
            tokenNumber,
            tableNumber: tableNumber || "",
            orderType: orderType || "takeaway",
            notes: notes || "",
            canteen: canteenId || null,
            deliveryMode: "pickup",
        });

        // Notify kitchen via socket
        const io = req.app.get("io");
        if (io) io.emit("newOrder", order);

        res.status(201).json(order);
    } catch (err) {
        logger.error("createGuestOrder error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get orders for staff (filtered by canteen if applicable)
// @route  GET /api/orders/staff
const getStaffOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        else filter.status = { $in: ["pending", "accepted", "preparing", "ready"] };

        // If user is manager/staff with canteen, scope to that canteen
        if (req.user.canteen) {
            filter.canteen = req.user.canteen;
        }

        const orders = await Order.find(filter)
            .populate("user", "name email phone")
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createOrder, createGuestOrder, getStaffOrders, getMyOrders, getAllOrders, getOrderById, updateOrderStatus, cancelOrder, getOrderQueueStatus };
