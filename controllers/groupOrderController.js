const GroupOrder = require("../models/GroupOrder");
const MenuItem = require("../models/MenuItem");
const { randomUUID } = require("crypto");
const logger = require("../utils/logger");

// @route  POST /api/group-orders  — host creates group cart
const createGroupOrder = async (req, res) => {
    try {
        const { canteen, splitMethod = "equal" } = req.body;
        if (!canteen) return res.status(400).json({ message: "Canteen is required" });

        const shareLink = randomUUID();
        const groupOrder = await GroupOrder.create({
            host: req.user._id,
            canteen,
            shareLink,
            splitMethod,
            participants: [{
                user: req.user._id,
                name: req.user.name,
                items: [],
                subTotal: 0,
            }],
        });
        await groupOrder.populate("canteen", "name location");
        res.status(201).json(groupOrder);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/group-orders/join/:shareLink  — participant joins
const joinGroupOrder = async (req, res) => {
    try {
        const groupOrder = await GroupOrder.findOne({ shareLink: req.params.shareLink, status: "open" });
        if (!groupOrder) return res.status(404).json({ message: "Group order not found or already closed" });

        // Check if user already joined
        const alreadyJoined = groupOrder.participants.some(
            p => p.user.toString() === req.user._id.toString()
        );
        if (alreadyJoined) {
            return res.json(groupOrder);
        }

        groupOrder.participants.push({
            user: req.user._id,
            name: req.user.name,
            items: [],
            subTotal: 0,
        });
        await groupOrder.save();
        await groupOrder.populate("canteen", "name location");
        
        // Notify via socket
        const io = req.app.get("io");
        if (io) io.to(`group-${groupOrder._id}`).emit("group:participant_joined", { user: req.user.name });
        
        res.json(groupOrder);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/group-orders/:shareLink  — get group order details
const getGroupOrder = async (req, res) => {
    try {
        const groupOrder = await GroupOrder.findOne({ shareLink: req.params.shareLink })
            .populate("host", "name email")
            .populate("canteen", "name location")
            .populate("participants.user", "name email");
        if (!groupOrder) return res.status(404).json({ message: "Group order not found" });
        res.json(groupOrder);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/group-orders/:shareLink/items  — add item to participant's list
const addItem = async (req, res) => {
    try {
        const { menuItemId, quantity = 1 } = req.body;
        const groupOrder = await GroupOrder.findOne({ shareLink: req.params.shareLink, status: "open" });
        if (!groupOrder) return res.status(404).json({ message: "Group order not found or locked" });

        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

        const participant = groupOrder.participants.find(
            p => p.user.toString() === req.user._id.toString()
        );
        if (!participant) return res.status(403).json({ message: "Join the group order first" });

        const existingItem = participant.items.find(i => i.menuItemId?.toString() === menuItemId);
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.subTotal = existingItem.quantity * menuItem.price;
        } else {
            participant.items.push({
                menuItemId,
                name: menuItem.name,
                price: menuItem.price,
                quantity,
                subTotal: quantity * menuItem.price,
            });
        }
        participant.subTotal = participant.items.reduce((acc, i) => acc + i.subTotal, 0);

        await groupOrder.save();

        const io = req.app.get("io");
        if (io) io.to(`group-${groupOrder._id}`).emit("group:item_added", { user: req.user.name, item: menuItem.name });

        res.json(groupOrder);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/group-orders/:shareLink/lock  — host locks and calculates split
const lockGroupOrder = async (req, res) => {
    try {
        const groupOrder = await GroupOrder.findOne({ shareLink: req.params.shareLink, status: "open" });
        if (!groupOrder) return res.status(404).json({ message: "Group order not found or already locked" });

        if (groupOrder.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the host can lock the order" });
        }

        const grandTotal = groupOrder.participants.reduce((acc, p) => acc + p.subTotal, 0);
        let splitAmounts = {};

        if (groupOrder.splitMethod === "equal") {
            const share = Math.round(grandTotal / groupOrder.participants.length);
            groupOrder.participants.forEach(p => { splitAmounts[p.user.toString()] = share; });
        } else {
            groupOrder.participants.forEach(p => { splitAmounts[p.user.toString()] = p.subTotal; });
        }

        groupOrder.status = "locked";
        groupOrder.grandTotal = grandTotal;
        groupOrder.splitAmounts = splitAmounts;
        await groupOrder.save();

        const io = req.app.get("io");
        if (io) io.to(`group-${groupOrder._id}`).emit("group:locked", { grandTotal, splitAmounts });

        res.json(groupOrder);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/group-orders  — get user's group orders
const getMyGroupOrders = async (req, res) => {
    try {
        const orders = await GroupOrder.find({ "participants.user": req.user._id })
            .populate("canteen", "name")
            .populate("host", "name")
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(orders);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createGroupOrder, joinGroupOrder, getGroupOrder, addItem, lockGroupOrder, getMyGroupOrders };
