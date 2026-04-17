const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const AuditLog = require("../models/AuditLog");
const { Parser } = require("json2csv");

// @desc   Get admin analytics summary
// @route  GET /api/analytics/summary
const getSummary = async (req, res) => {
    try {
        const { export: exportType } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const todayOrders = await Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } });
        const todayRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: today, $lt: tomorrow }, paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const topItems = await Order.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.name", totalQty: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
            { $sort: { totalQty: -1 } },
            { $limit: 5 },
        ]);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const dailyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: "paid" } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        // Category-wise breakdown
        const categoryRevenue = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "menuitems",
                    localField: "items.menuItem",
                    foreignField: "_id",
                    as: "menuData",
                },
            },
            { $unwind: { path: "$menuData", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$menuData.category",
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    count: { $sum: "$items.quantity" },
                },
            },
        ]);

        // Canteen-wise breakdown
        const canteenRevenue = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            {
                $lookup: {
                    from: "canteens",
                    localField: "canteen",
                    foreignField: "_id",
                    as: "canteenData",
                },
            },
            { $unwind: "$canteenData" },
            {
                $group: {
                    _id: "$canteenData.name",
                    revenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Payment method breakdown
        const paymentMethods = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
        ]);

        if (exportType === "csv") {
            const orders = await Order.find().populate("user", "name email").sort("-createdAt");
            const fields = ["createdAt", "tokenNumber", "user.name", "totalAmount", "status", "paymentStatus", "paymentMethod"];
            const parser = new Parser({ fields });
            const csv = parser.parse(orders);
            res.header("Content-Type", "text/csv");
            res.attachment("canteen_orders_report.csv");
            return res.send(csv);
        }

        res.json({
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            todayOrders,
            todayRevenue: todayRevenue[0]?.total || 0,
            ordersByStatus,
            topItems,
            dailyRevenue,
            categoryRevenue,
            canteenRevenue,
            paymentMethods,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get peak hour data
// @route  GET /api/analytics/peak-hours
const getPeakHours = async (req, res) => {
    try {
        const peakHours = await Order.aggregate([
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    orderCount: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Fill in all 24 hours
        const hourMap = {};
        peakHours.forEach((h) => { hourMap[h._id] = h; });
        const result = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i < 12 ? "AM" : "PM"}`,
            orderCount: hourMap[i]?.orderCount || 0,
            revenue: hourMap[i]?.revenue || 0,
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Export orders as XLSX
// @route  GET /api/analytics/export?format=xlsx
const exportData = async (req, res) => {
    try {
        const { format } = req.query;
        const orders = await Order.find().populate("user", "name email").sort("-createdAt");

        const rows = orders.map((o) => ({
            Date: new Date(o.createdAt).toLocaleString("en-IN"),
            Token: o.tokenNumber,
            Customer: o.user?.name || "N/A",
            Email: o.user?.email || "",
            Total: o.totalAmount,
            Items: o.items.map((i) => `${i.name}x${i.quantity}`).join(", "),
            Status: o.status,
            Payment: o.paymentMethod,
            "Payment Status": o.paymentStatus,
        }));

        if (format === "xlsx") {
            const XLSX = require("xlsx");
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, "Orders");
            const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
            res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.attachment("canteen_orders.xlsx");
            return res.send(buffer);
        }

        // Default CSV
        const { Parser } = require("json2csv");
        const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
        const csv = parser.parse(rows);
        res.header("Content-Type", "text/csv");
        res.attachment("canteen_orders.csv");
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get admin audit log
// @route  GET /api/analytics/audit-log
const getAuditLog = async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const logs = await AuditLog.find()
            .populate("admin", "name email")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await AuditLog.countDocuments();
        res.json({ logs, total, page: parseInt(page) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getSummary, getPeakHours, exportData, getAuditLog };
