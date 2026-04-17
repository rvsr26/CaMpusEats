const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

// @desc   Get "Frequently Bought Together" for a specific menu item
// @route  GET /api/recommendations?itemId=xxx
const getFrequentlyBoughtTogether = async (req, res) => {
    try {
        const { itemId } = req.query;
        if (!itemId) return res.status(400).json({ message: "itemId required" });

        const currentItem = await MenuItem.findById(itemId);
        if (!currentItem) return res.status(404).json({ message: "Item not found" });

        // 1. Collaborative Filtering: Find all orders containing this item
        const orders = await Order.find({ "items.menuItem": itemId }, { "items.menuItem": 1 });

        // Count co-occurrences
        const coCount = {};
        for (const order of orders) {
            for (const i of order.items) {
                const id = i.menuItem.toString();
                if (id !== itemId) {
                    coCount[id] = (coCount[id] || 0) + 1;
                }
            }
        }

        // Sort by count descending
        let topIds = Object.entries(coCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([id]) => id);

        // 2. Hybrid Fallback: If not enough co-occurrences, use Content-Based Filtering
        if (topIds.length < 2) {
            const similarItems = await MenuItem.find({
                _id: { $ne: itemId },
                availability: true,
                $or: [
                    { category: currentItem.category },
                    { tags: { $in: currentItem.tags || [] } }
                ]
            })
            .select("name price image category isVeg avgRating")
            .limit(4 - topIds.length);

            const similarIds = similarItems.map(i => i._id.toString());
            topIds = [...new Set([...topIds, ...similarIds])];
        }

        if (topIds.length === 0) {
            return getTrendingItems(req, res);
        }

        const items = await MenuItem.find({ _id: { $in: topIds }, availability: true })
            .select("name price image category isVeg avgRating");
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get user's top re-order items based on order history
// @route  GET /api/recommendations/reorder  (protected)
const getReorderSuggestions = async (req, res) => {
    try {
        const agg = await Order.aggregate([
            { $match: { user: req.user._id, status: { $in: ["completed", "ready"] } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.menuItem",
                    itemName: { $first: "$items.name" },
                    totalOrdered: { $sum: "$items.quantity" },
                    lastOrdered: { $max: "$createdAt" },
                },
            },
            { $sort: { totalOrdered: -1 } },
            { $limit: 4 },
        ]);

        // Fetch current info (price, availability) from MenuItem
        const ids = agg.map((a) => a._id);
        const items = await MenuItem.find({ _id: { $in: ids }, availability: true })
            .select("name price image category isVeg avgRating");

        // Merge order stats with item data
        const result = items.map((item) => {
            const stat = agg.find((a) => a._id.toString() === item._id.toString());
            return { ...item.toObject(), totalOrdered: stat?.totalOrdered || 0, lastOrdered: stat?.lastOrdered };
        }).sort((a, b) => b.totalOrdered - a.totalOrdered);

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get site-wide trending items this week (public)
// @route  GET /api/recommendations/trending
const getTrendingItems = async (req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const agg = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.menuItem",
                    totalOrdered: { $sum: "$items.quantity" },
                },
            },
            { $sort: { totalOrdered: -1 } },
            { $limit: 6 },
        ]);

        const ids = agg.map((a) => a._id);
        const items = await MenuItem.find({ _id: { $in: ids }, availability: true })
            .select("name price image category isVeg avgRating");

        const result = items.map((item) => {
            const stat = agg.find((a) => a._id.toString() === item._id.toString());
            return { ...item.toObject(), totalOrdered: stat?.totalOrdered || 0 };
        }).sort((a, b) => b.totalOrdered - a.totalOrdered);

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getFrequentlyBoughtTogether, getReorderSuggestions, getTrendingItems };
