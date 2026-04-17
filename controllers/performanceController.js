const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const { hasRole } = require("../middleware/authMiddleware");

// @route  GET /api/performance/summary  — KPIs + revenue trend
const getPerformanceSummary = async (req, res) => {
    try {
        if (!hasRole(req.user, "staff")) return res.status(403).json({ message: "Access denied" });

        const canteenFilter = req.user.role === "super-admin" ? {} : { canteen: req.user.canteen };

        // Revenue/order count by day (last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const revenueByDay = await Order.aggregate([
            {
                $match: {
                    ...canteenFilter,
                    status: { $in: ["completed", "delivered"] },
                    createdAt: { $gte: fourteenDaysAgo },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 },
                    avgOrder: { $avg: "$totalAmount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Top 5 menu items by qty sold
        const topItems = await Order.aggregate([
            {
                $match: {
                    ...canteenFilter,
                    status: { $in: ["completed", "delivered"] },
                    createdAt: { $gte: fourteenDaysAgo },
                },
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    totalQty: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                },
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 },
        ]);

        // Peak hour heatmap (hour 0-23)
        const peakHours = await Order.aggregate([
            {
                $match: {
                    ...canteenFilter,
                    status: { $in: ["completed", "delivered"] },
                    createdAt: { $gte: fourteenDaysAgo },
                },
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // KPI summary
        const [kpiData] = await Order.aggregate([
            {
                $match: {
                    ...canteenFilter,
                    status: { $in: ["completed", "delivered"] },
                    createdAt: { $gte: fourteenDaysAgo },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: "$totalAmount" },
                },
            },
        ]);

        res.json({
            revenueByDay,
            topItems,
            peakHours: peakHours.map(h => ({ hour: h._id, count: h.count, revenue: h.revenue })),
            kpis: kpiData || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/performance/items  — full item breakdown
const getItemPerformance = async (req, res) => {
    try {
        if (!hasRole(req.user, "staff")) return res.status(403).json({ message: "Access denied" });

        const canteenFilter = req.user.role === "super-admin" ? {} : { canteen: req.user.canteen };
        const days = parseInt(req.query.days) || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const items = await Order.aggregate([
            { $match: { ...canteenFilter, status: { $in: ["completed", "delivered"] }, createdAt: { $gte: since } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    totalQty: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    avgPrice: { $avg: "$items.price" },
                },
            },
            { $sort: { totalRevenue: -1 } },
        ]);

        res.json(items);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getPerformanceSummary, getItemPerformance };
