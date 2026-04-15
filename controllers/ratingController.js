const Rating = require("../models/Rating");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");

// @desc   Submit a rating for an order's menu items
// @route  POST /api/ratings
const submitRating = async (req, res) => {
    try {
        const { menuItemId, orderId, rating, comment } = req.body;

        // Verify order belongs to user and is completed
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        if (order.status !== "completed") {
            return res.status(400).json({ message: "You can only rate completed orders" });
        }

        // Check if already rated this order
        const existing = await Rating.findOne({ user: req.user._id, order: orderId });
        if (existing) return res.status(400).json({ message: "You have already rated this order" });

        const newRating = await Rating.create({
            user: req.user._id,
            menuItem: menuItemId,
            order: orderId,
            rating,
            comment: comment || "",
        });

        // Update MenuItem's average rating
        const agg = await Rating.aggregate([
            { $match: { menuItem: newRating.menuItem } },
            { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]);
        if (agg.length > 0) {
            await MenuItem.findByIdAndUpdate(menuItemId, {
                avgRating: Math.round(agg[0].avg * 10) / 10,
                ratingCount: agg[0].count,
            });
        }

        res.status(201).json(newRating);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Already rated this order" });
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get ratings for a menu item
// @route  GET /api/ratings/:menuItemId
const getItemRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({ menuItem: req.params.menuItemId })
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(ratings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { submitRating, getItemRatings };
