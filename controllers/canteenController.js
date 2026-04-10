const Canteen = require("../models/Canteen");
const User = require("../models/User");
const logger = require("../utils/logger");

// @route  GET /api/canteens  (public)
const getCanteens = async (req, res) => {
    try {
        const canteens = await Canteen.find().sort({ sortOrder: 1, name: 1 }).populate("managers", "name email");
        res.json(canteens);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/canteens  (super-admin)
const createCanteen = async (req, res) => {
    try {
        const {
            name, description, image, location, openTime, closeTime, sortOrder,
            rating, numRatings, avgPrice, cuisine, distance, offers, isPromoted, isNew
        } = req.body;
        if (!name) return res.status(400).json({ message: "Name required" });
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const canteen = await Canteen.create({
            name, slug, description, image, location, openTime, closeTime, sortOrder,
            rating, numRatings, avgPrice, cuisine, distance, offers, isPromoted, isNew
        });
        res.status(201).json(canteen);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Canteen name already exists" });
        res.status(500).json({ message: err.message });
    }
};

// @route  PUT /api/canteens/:id  (super-admin)
const updateCanteen = async (req, res) => {
    try {
        const canteen = await Canteen.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!canteen) return res.status(404).json({ message: "Canteen not found" });
        res.json(canteen);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  DELETE /api/canteens/:id  (super-admin)
const deleteCanteen = async (req, res) => {
    try {
        await Canteen.findByIdAndDelete(req.params.id);
        res.json({ message: "Canteen deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/canteens/:id/assign-manager  (super-admin)
const assignManager = async (req, res) => {
    try {
        const { userId } = req.body;
        const [canteen, user] = await Promise.all([
            Canteen.findById(req.params.id),
            User.findById(userId),
        ]);
        if (!canteen || !user) return res.status(404).json({ message: "Canteen or user not found" });
        // Add canteen to user's managed canteen, promote to manager if student
        user.canteen = canteen._id;
        if (user.role === "student") user.role = "manager";
        await user.save();
        // Add user to canteen managers if not already
        if (!canteen.managers.includes(userId)) {
            canteen.managers.push(userId);
            await canteen.save();
        }
        res.json({ message: `${user.name} assigned as manager of ${canteen.name}` });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

const Order = require("../models/Order");

// @route  GET /api/canteens/:id/traffic  (public)
const getCanteenTraffic = async (req, res) => {
    try {
        const canteenId = req.params.id;

        // Count active orders for this canteen
        const activeOrdersCount = await Order.countDocuments({
            canteen: canteenId,
            status: { $in: ["pending", "accepted", "preparing"] }
        });

        let status = "quiet";
        let waitTime = "5-10 mins";

        if (activeOrdersCount >= 20) {
            status = "busy";
            waitTime = "25+ mins";
        } else if (activeOrdersCount >= 8) {
            status = "moderate";
            waitTime = "15-20 mins";
        }

        res.json({
            canteenId,
            activeOrders: activeOrdersCount,
            status,
            estimatedWait: waitTime
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCanteens, createCanteen, updateCanteen, deleteCanteen, assignManager, getCanteenTraffic };
