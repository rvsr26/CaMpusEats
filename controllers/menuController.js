const MenuItem = require("../models/MenuItem");

// @desc   Get all menu items (with optional search and filters)
// @route  GET /api/menu
const getMenuItems = async (req, res) => {
    try {
        const { category, available, veg, q, canteen, tags, station } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (available !== undefined) filter.availability = available === "true";
        if (veg !== undefined) filter.isVeg = veg === "true";
        if (canteen) filter.canteen = canteen;
        if (station) filter.station = station;
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            filter.tags = { $in: tagList };
        }

        let query;
        if (q && q.trim()) {
            // Text search (requires text index on name + description)
            query = MenuItem.find({ ...filter, $text: { $search: q.trim() } }, { score: { $meta: "textScore" } })
                .sort({ score: { $meta: "textScore" } });
        } else {
            query = MenuItem.find(filter).sort({ category: 1, name: 1 });
        }

        const items = await query;
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get single menu item
// @route  GET /api/menu/:id
const getMenuItemById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Create menu item (Admin)
// @route  POST /api/menu
const createMenuItem = async (req, res) => {
    try {
        const { name, category, price, description, isVeg, preparationTime, stockQuantity, availableFrom, availableTo } = req.body;
        const image = req.file ? req.file.path : req.body.image || "";
        const item = await MenuItem.create({
            name, category, price, description, isVeg, preparationTime, image,
            stockQuantity: stockQuantity || 999,
            availableFrom: availableFrom || null,
            availableTo: availableTo || null,
        });
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Update menu item (Admin)
// @route  PUT /api/menu/:id
const updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const fields = ["name", "category", "price", "description", "availability", "isVeg", "preparationTime", "stockQuantity", "availableFrom", "availableTo"];
        fields.forEach((f) => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
        if (req.file) item.image = req.file.path;
        await item.save();
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Delete menu item (Admin)
// @route  DELETE /api/menu/:id
const deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get search suggestions
// @route  GET /api/menu/suggestions
const getSearchSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const items = await MenuItem.find({
            name: { $regex: q, $options: "i" }
        }).select("name category").limit(5);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Get canteen busy status
// @route  GET /api/menu/status/busy
const getBusyStatus = async (req, res) => {
    try {
        const Order = require("../models/Order");
        const activeOrdersCount = await Order.countDocuments({ status: { $in: ["Placed", "Accepted", "Preparing"] } });

        let status = "Available";
        let color = "var(--success-green)";
        let waitTime = 5;

        if (activeOrdersCount > 10) {
            status = "Busy";
            color = "var(--accent-orange)";
            waitTime = 15;
        } else if (activeOrdersCount > 20) {
            status = "Very Busy";
            color = "var(--error-red)";
            waitTime = 25;
        }

        res.json({ status, color, waitTime, activeOrdersCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getSearchSuggestions,
    getBusyStatus
};
