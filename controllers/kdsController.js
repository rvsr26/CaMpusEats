const Order = require("../models/Order");

// @desc    Get aggregated items for KDS
// @route   GET /api/kds/aggregate
// @access  Private (Staff/Admin)
exports.getAggregatedOrders = async (req, res) => {
    try {
        const canteenId = req.user.canteen; // Assuming staff belongs to a canteen

        const query = {
            status: { $in: ["accepted", "preparing"] }
        };

        if (canteenId) {
            query.canteen = canteenId;
        }

        const orders = await Order.find(query).populate("items.menuItem", "station");

        const aggregated = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                const id = item.menuItem && item.menuItem._id ? item.menuItem._id.toString() : item.menuItem.toString();
                const station = item.menuItem && item.menuItem.station ? item.menuItem.station : "General";

                if (!aggregated[station]) {
                    aggregated[station] = {};
                }

                if (!aggregated[station][id]) {
                    aggregated[station][id] = {
                        menuItemId: id,
                        name: item.name,
                        station: station,
                        totalQuantity: 0,
                        orderIds: [],
                        preparationTime: item.menuItem?.preparationTime || 10
                    };
                }
                
                aggregated[station][id].totalQuantity += item.quantity;
                if (!aggregated[station][id].orderIds.includes(order._id.toString())) {
                    aggregated[station][id].orderIds.push(order._id.toString());
                }
            });
        });

        // Flatten to a list of stations with their items
        const result = Object.entries(aggregated).map(([stationName, items]) => ({
            station: stationName,
            items: Object.values(items).sort((a, b) => b.totalQuantity - a.totalQuantity)
        })).sort((a, b) => a.station.localeCompare(b.station));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
