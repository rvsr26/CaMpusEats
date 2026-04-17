const MenuItem = require("../models/MenuItem");

// @desc    Get dynamic pricing discounts for a canteen
// @route   GET /api/pricing/:canteenId
// @access  Public
exports.getDynamicDiscounts = async (req, res) => {
    try {
        const { canteenId } = req.params;
        
        // Find all perishable items for this canteen
        const items = await MenuItem.find({
            canteen: canteenId,
            isPerishable: true,
            availability: true,
            stockQuantity: { $gt: 0 }
        });

        // Current time logic
        const now = new Date();
        const currentHour = now.getHours();

        // HEURISTIC: Happy Hour starts after 4 PM (16:00) for many college canteens
        // In a real system, this would be tied to Canteen.closingTime
        const isHappyHour = currentHour >= 16; 

        const discountedItems = items.map(item => {
            let discount = 0;
            let reason = "";

            // Rule 1: Time-based (Happy Hour)
            if (isHappyHour) {
                discount = 0.20; // 20% off
                reason = "Happy Hour";
            }

            // Rule 2: Overstock-based
            if (item.stockQuantity > 50) {
                discount = Math.max(discount, 0.15); // 15% off
                reason = reason ? "Flash Sale + Overstock" : "Overstock Clearance";
            }

            const currentPrice = item.price;
            const originalPrice = item.basePrice || currentPrice;
            const newPrice = Math.floor(originalPrice * (1 - discount));

            return {
                _id: item._id,
                name: item.name,
                originalPrice,
                currentPrice: newPrice,
                discountPercent: Math.round(discount * 100),
                reason
            };
        }).filter(item => item.discountPercent > 0);

        res.status(200).json(discountedItems);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// @desc    Apply dynamic prices to DB (typically called via Cron)
// @route   POST /api/pricing/apply
// @access  Private (Admin)
exports.applyDynamicPrices = async (req, res) => {
    try {
        const items = await MenuItem.find({ isPerishable: true });
        let updatedCount = 0;

        for (const item of items) {
            const originalPrice = item.basePrice || item.price;
            
            // If basePrice wasn't set, set it now
            if (!item.basePrice) {
                item.basePrice = item.price;
            }

            const now = new Date();
            const currentHour = now.getHours();
            let discount = 0;

            if (currentHour >= 17) discount = 0.30; // 30% off after 5pm
            else if (currentHour >= 15) discount = 0.15; // 15% off after 3pm
            
            const targetPrice = Math.floor(originalPrice * (1 - discount));
            
            if (item.price !== targetPrice) {
                item.price = targetPrice;
                await item.save();
                updatedCount++;
            }
        }

        res.json({ message: `Successfully updated ${updatedCount} perishable items.` });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
