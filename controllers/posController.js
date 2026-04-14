const Order = require("../models/Order");
const User = require("../models/User");
const MenuItem = require("../models/MenuItem");
const WalletTransaction = require("../models/WalletTransaction");
const Notification = require("../models/Notification");
const { deductIngredients } = require("./inventoryController");
const logger = require("../utils/logger");

// @desc   Place POS order on behalf of a student (cashier mode)
// @route  POST /api/orders/pos
const placePOSOrder = async (req, res) => {
    try {
        const { studentEmail, items, paymentMethod, notes } = req.body;

        if (!studentEmail || !items?.length) {
            return res.status(400).json({ message: "studentEmail and items are required" });
        }

        // Find student
        const student = await User.findOne({ email: studentEmail.toLowerCase() });
        if (!student) return res.status(404).json({ message: "No student found with that email" });

        // Validate and price items
        const orderItems = [];
        let totalAmount = 0;

        for (const { menuItemId, quantity } of items) {
            const menuItem = await MenuItem.findById(menuItemId);
            if (!menuItem) return res.status(404).json({ message: `Menu item ${menuItemId} not found` });
            if (!menuItem.availability) return res.status(400).json({ message: `${menuItem.name} is not available` });
            orderItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: Number(quantity) || 1,
            });
            totalAmount += menuItem.price * (Number(quantity) || 1);
        }

        // Token number (daily sequential)
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const count = await Order.countDocuments({ createdAt: { $gte: today } });
        const tokenNumber = count + 1;

        // Wallet deduction if payment via wallet
        if (paymentMethod === "Wallet") {
            if (student.walletBalance < totalAmount) {
                return res.status(400).json({ message: `Student wallet has ₹${student.walletBalance}, needs ₹${totalAmount}` });
            }
            student.walletBalance -= totalAmount;
            const pts = Math.floor(totalAmount / 10);
            student.loyaltyPoints += pts;
            await student.save();
            await WalletTransaction.create({
                user: student._id, type: "debit", amount: totalAmount,
                description: `POS Order #${tokenNumber} (Cashier: ${req.user.name})`,
                balanceAfter: student.walletBalance,
            });
        }

        const order = await Order.create({
            user: student._id,
            items: orderItems,
            totalAmount,
            paymentMethod: paymentMethod || "Cash",
            paymentStatus: paymentMethod === "Wallet" ? "paid" : (paymentMethod === "Cash" ? "unpaid" : "paid"),
            tokenNumber,
            pickupTime: new Date(Date.now() + 15 * 60 * 1000),
            notes: notes || "",
            placedBy: req.user._id,
            canteen: req.user.canteen || null,
        });

        // Decrement stock
        for (const item of orderItems) {
            await MenuItem.findByIdAndUpdate(item.menuItem, { $inc: { stockQuantity: -item.quantity } });
        }
        const io = req.app.get("io");
        deductIngredients(orderItems, io).catch(() => { });

        // Notify student
        await Notification.create({
            user: student._id,
            title: "📦 Order Placed (Counter)",
            message: `Token #${tokenNumber} — ₹${totalAmount} via ${paymentMethod || "Cash"}. Ready in ~15 min!`,
            type: "order",
            orderId: order._id,
        });
        if (io) {
            io.to(student._id.toString()).emit("notification", { title: "Order Placed", tokenNumber });
            io.emit("newOrder", order);
        }

        await order.populate("user", "name email phone");
        res.status(201).json(order);
    } catch (err) {
        logger.error("placePOSOrder error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { placePOSOrder };
