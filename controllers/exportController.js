const User = require("../models/User");
const Order = require("../models/Order");
const WalletTransaction = require("../models/WalletTransaction");
const Rating = require("../models/Rating");
const Notification = require("../models/Notification");

// @route  GET /api/user/export
// @desc   Download all personal data as JSON (GDPR compliance)
const exportUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all data in parallel
        const [user, orders, transactions, ratings, notifications] = await Promise.all([
            User.findById(userId).select("-password -refreshToken -verificationToken -walletPin"),
            Order.find({ user: userId }).sort({ createdAt: -1 }).limit(500),
            WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(500),
            Rating.find({ user: userId }).populate("menuItem", "name category"),
            Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(200),
        ]);

        const exportData = {
            exportedAt: new Date().toISOString(),
            exportedBy: user.email,
            profile: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                walletBalance: user.walletBalance,
                loyaltyPoints: user.loyaltyPoints,
                memberSince: user.createdAt,
            },
            orders: orders.map((o) => ({
                tokenNumber: o.tokenNumber,
                status: o.status,
                totalAmount: o.totalAmount,
                paymentMethod: o.paymentMethod,
                items: o.items,
                placedAt: o.createdAt,
            })),
            walletTransactions: transactions.map((t) => ({
                type: t.type,
                amount: t.amount,
                description: t.description,
                balanceAfter: t.balanceAfter,
                date: t.createdAt,
            })),
            ratings: ratings.map((r) => ({
                item: r.menuItem?.name,
                category: r.menuItem?.category,
                rating: r.rating,
                comment: r.comment,
                date: r.createdAt,
            })),
            notifications: notifications.map((n) => ({
                title: n.title,
                message: n.message,
                type: n.type,
                read: n.read,
                date: n.createdAt,
            })),
            summary: {
                totalOrders: orders.length,
                totalSpent: orders.filter(o => o.status !== "cancelled")
                    .reduce((s, o) => s + o.totalAmount, 0),
                totalWalletTransactions: transactions.length,
                totalRatings: ratings.length,
            },
        };

        const filename = `campuseats-data-${user.email.replace("@", "_at_")}-${Date.now()}.json`;
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/json");
        res.json(exportData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route  DELETE /api/user/account  — GDPR "right to be forgotten"
const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id);
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

        // Anonymize orders instead of deleting (for accounting integrity)
        await Order.updateMany({ user: req.user._id }, { $set: { user: null } });
        await User.findByIdAndDelete(req.user._id);

        res.clearCookie("refreshToken");
        res.json({ message: "Account deleted. All personal data has been removed." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { exportUserData, deleteAccount };
