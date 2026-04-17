const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

// @desc    Get Personalized AI Recommendations
// @route   GET /api/ai/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get user's order history
        const userOrders = await Order.find({ user: userId }).select("items.menuItem");

        let userFavoriteItemIds = [];
        if (userOrders.length > 0) {
            // Flatten and get unique items user has ever ordered
            const allOrderedItems = userOrders.flatMap(o => o.items.map(i => i.menuItem.toString()));
            userFavoriteItemIds = [...new Set(allOrderedItems)];
        }

        // 2. Collaborative Filtering: "Students like you ordered..."
        let collaborativeRecommendations = [];
        if (userFavoriteItemIds.length > 0) {
            // Find orders from OTHER users that contain at least one of the items this user likes
            const similarUsersOrders = await Order.find({
                user: { $ne: userId },
                "items.menuItem": { $in: userFavoriteItemIds }
            }).select("items.menuItem items.name");

            const itemScores = {};

            similarUsersOrders.forEach(order => {
                order.items.forEach(item => {
                    const id = item.menuItem.toString();
                    // We only want to recommend things the current user hasn't tried!
                    if (!userFavoriteItemIds.includes(id)) {
                        itemScores[id] = (itemScores[id] || 0) + 1;
                    }
                });
            });

            // Sort by score
            const sortedIds = Object.keys(itemScores).sort((a, b) => itemScores[b] - itemScores[a]).slice(0, 4);
            if (sortedIds.length > 0) {
                collaborativeRecommendations = await MenuItem.find({ _id: { $in: sortedIds }, availability: true });
            }
        }

        // 3. Trending / Popular Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysOrders = await Order.find({ createdAt: { $gte: today } }).select("items.menuItem items.quantity");
        const trendingScores = {};
        todaysOrders.forEach(order => {
            order.items.forEach(item => {
                const id = item.menuItem.toString();
                trendingScores[id] = (trendingScores[id] || 0) + item.quantity;
            });
        });

        const trendingIds = Object.keys(trendingScores).sort((a, b) => trendingScores[b] - trendingScores[a]).slice(0, 4);
        let trendingItems = [];
        if (trendingIds.length > 0) {
            trendingItems = await MenuItem.find({ _id: { $in: trendingIds }, availability: true });
        } else {
            // Fallback to top rated if no orders today
            trendingItems = await MenuItem.find({ availability: true }).sort({ avgRating: -1 }).limit(4);
        }

        res.json({
            collaborative: collaborativeRecommendations,
            trending: trendingItems
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get Demand Prediction / Forecasting
// @route   GET /api/ai/demand-prediction
// @access  Private (Admin/Staff)
const getDemandPrediction = async (req, res) => {
    try {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowDayNum = tomorrow.getDay(); // 0 (Sun) to 6 (Sat)

        // 1. Get historical average for tomorrow's specific day of week
        // We look back at last 4 weeks (28 days)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(today.getDate() - 28);

        const orders = await Order.find({
            createdAt: { $gte: fourWeeksAgo },
            status: { $ne: "cancelled" }
        }).select("createdAt items.name items.quantity");

        // Group by day of week
        const dayStats = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        const itemFreqByDay = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };

        // Helper to get date string YYYY-MM-DD
        const getDateStr = (d) => d.toISOString().split('T')[0];

        // Group orders by date first to count daily totals
        const dailyTotals = {};

        orders.forEach(order => {
            const dateStr = getDateStr(order.createdAt);
            const dayNum = order.createdAt.getDay();

            dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + 1;

            order.items.forEach(item => {
                itemFreqByDay[dayNum][item.name] = (itemFreqByDay[dayNum][item.name] || 0) + item.quantity;
            });
        });

        // Map daily totals to their day of week lists
        Object.entries(dailyTotals).forEach(([dateStr, count]) => {
            const d = new Date(dateStr);
            dayStats[d.getDay()].push(count);
        });

        const getAvg = (arr) => arr.length ? Math.ceil(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

        const predictedVolume = getAvg(dayStats[tomorrowDayNum]);

        // Find most frequent item for tomorrow's day
        const itemsForTomorrow = itemFreqByDay[tomorrowDayNum];
        const topItem = Object.keys(itemsForTomorrow).sort((a, b) => itemsForTomorrow[b] - itemsForTomorrow[a])[0] || "None";

        // Busy hours (peak detection)
        const hourStats = Array(24).fill(0);
        orders.forEach(order => {
            hourStats[order.createdAt.getHours()]++;
        });
        const peakHour = hourStats.indexOf(Math.max(...hourStats));

        res.json({
            tomorrow: {
                dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][tomorrowDayNum],
                predictedOrders: predictedVolume,
                topPredictedItem: topItem,
                confidence: dayStats[tomorrowDayNum].length > 0 ? "High" : "Low (Insufficient Data)"
            },
            peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
            weeklyAverage: getAvg(Object.values(dailyTotals))
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getRecommendations, getDemandPrediction };
