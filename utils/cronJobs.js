const cron = require("node-cron");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const logger = require("./logger");

const startCronJobs = (io) => {
    // Every minute: activate scheduled pre-orders whose time has come
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const readyOrders = await Order.find({
                status: "scheduled",
                scheduledTime: { $lte: now },
            }).populate("user", "_id name");

            for (const order of readyOrders) {
                // Assign token number
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const count = await Order.countDocuments({ createdAt: { $gte: today }, status: { $ne: "scheduled" } });
                order.tokenNumber = count + 1;
                order.status = "pending";
                order.pickupTime = new Date(Date.now() + 20 * 60 * 1000);
                await order.save();

                // Notify admin + student
                if (io) io.emit("newOrder", order);
                const notif = await Notification.create({
                    user: order.user._id,
                    title: "⏰ Pre-Order Activated!",
                    message: `Your scheduled order is now active! Token #${order.tokenNumber} — expect pickup in 20 min.`,
                    type: "order", orderId: order._id,
                });
                if (io) io.to(order.user._id.toString()).emit("notification", notif);
                logger.info(`Cron: Activated scheduled order ${order._id}, token #${order.tokenNumber}`);
            }

            // Disable expired menu items
            const expired = await MenuItem.updateMany(
                { availableTo: { $lte: now }, availability: true },
                { $set: { availability: false } }
            );
            if (expired.modifiedCount > 0) {
                logger.info(`Cron: Auto-disabled ${expired.modifiedCount} expired menu item(s)`);
            }
        } catch (err) { logger.error("Cron job error (minute):", err.message); }
    });

    // Every day at midnight: re-enable scheduled menu items
    cron.schedule("0 0 * * *", async () => {
        try {
            const now = new Date();
            const result = await MenuItem.updateMany(
                { availableFrom: { $lte: now }, availableTo: { $gt: now }, availability: false },
                { $set: { availability: true } }
            );
            if (result.modifiedCount > 0) {
                logger.info(`Cron: Auto-enabled ${result.modifiedCount} scheduled menu item(s)`);
            }
        } catch (err) { logger.error("Cron job error (midnight):", err.message); }
    });

    // Every day at 8 AM: check inventory for low stock and notify admins
    cron.schedule("0 8 * * *", async () => {
        try {
            const Ingredient = require("../models/Ingredient");
            const User = require("../models/User");

            const lowStockItems = await Ingredient.find({
                $expr: { $lte: ["$stockQty", "$lowStockThreshold"] } // where stockQty <= lowStockThreshold
            }).populate("canteen", "name");

            if (lowStockItems.length > 0) {
                // Find all admins and managers
                const admins = await User.find({ role: { $in: ["admin", "super-admin", "manager"] } });

                for (const item of lowStockItems) {
                    // Send to all admins, or just the manager of that specific canteen
                    const targetUsers = admins.filter(u =>
                        ["admin", "super-admin"].includes(u.role) ||
                        (u.role === "manager" && u.canteen && u.canteen.toString() === item.canteen?._id.toString())
                    );

                    for (const user of targetUsers) {
                        await Notification.create({
                            user: user._id,
                            title: "⚠️ Low Stock Alert",
                            message: `${item.name} is running low! Only ${item.stockQty} ${item.unit} left at ${item.canteen?.name || 'Main Canteen'}.`,
                            type: "system"
                        });
                        if (io) io.to(user._id.toString()).emit("notification", {
                            title: "⚠️ Low Stock Alert",
                            message: `${item.name} is running low! Only ${item.stockQty} ${item.unit} left.`,
                            type: "system"
                        });
                    }
                }
                logger.info(`Cron: Generated ${lowStockItems.length} low stock alerts for inventory`);
            }
        } catch (err) { logger.error("Cron job error (inventory):", err.message); }
    });

    // Every hour: Apply Dynamic Pricing for perishable items
    cron.schedule("0 * * * *", async () => {
        try {
            const items = await MenuItem.find({ isPerishable: true });
            let updatedCount = 0;
            const now = new Date();
            const currentHour = now.getHours();

            for (const item of items) {
                const originalPrice = item.basePrice || item.price;
                if (!item.basePrice) {
                    item.basePrice = item.price;
                }

                let discount = 0;
                // Rule: Higher discount as it gets later
                if (currentHour >= 18) discount = 0.40;      // 40% off after 6pm
                else if (currentHour >= 16) discount = 0.20; // 20% off after 4pm
                else if (currentHour >= 14) discount = 0.10; // 10% off after 2pm

                const targetPrice = Math.floor(originalPrice * (1 - discount));
                if (item.price !== targetPrice) {
                    item.price = targetPrice;
                    await item.save();
                    updatedCount++;
                }
            }
            if (updatedCount > 0) {
                logger.info(`Cron: Dynamic pricing updated ${updatedCount} perishable item(s)`);
            }
        } catch (err) { logger.error("Cron job error (dynamic-pricing):", err.message); }
    });


    // Every day at 6 AM: Process subscription renewals
    cron.schedule("0 6 * * *", async () => {
        try {
            const { processRenewals } = require("../controllers/subscriptionController");
            await processRenewals(io);
            logger.info("Cron: Processed subscription renewals");
        } catch (err) { logger.error("Cron job error (subscriptions):", err.message); }
    });

    // Every hour: Auto-escalate tickets with no response in 24h
    cron.schedule("0 * * * *", async () => {
        try {
            const { SupportTicket } = require("../models/SupportTicket");
            const User = require("../models/User");
            const Notification = require("../models/Notification");
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const staleTickets = await SupportTicket.find({
                status: "open",
                escalationLevel: 0,
                updatedAt: { $lte: twentyFourHoursAgo },
            });

            for (const ticket of staleTickets) {
                ticket.escalationLevel = 1;
                ticket.escalatedAt = new Date();
                ticket.escalationReason = "Auto-escalated: No response in 24 hours";
                await ticket.save();

                const admins = await User.find({ role: { $in: ["admin", "super-admin"] } });
                for (const admin of admins) {
                    const notif = await Notification.create({
                        user: admin._id,
                        title: "🚨 Ticket Auto-Escalated",
                        message: `Ticket "${ticket.subject}" has been auto-escalated after 24h with no response.`,
                        type: "system",
                    });
                    if (io) io.to(admin._id.toString()).emit("notification", notif);
                }
                logger.info(`Cron: Auto-escalated ticket ${ticket._id}`);
            }
        } catch (err) { logger.error("Cron job error (auto-escalation):", err.message); }
    });

    logger.info("✅ Cron jobs started");
};

module.exports = { startCronJobs };
