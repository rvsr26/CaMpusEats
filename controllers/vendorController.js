const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const Ingredient = require("../models/Ingredient");

// === Suppliers ===
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.json(suppliers);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// === Purchase Orders ===
const getPurchaseOrders = async (req, res) => {
    try {
        const pos = await PurchaseOrder.find()
            .populate("supplier", "name")
            .populate("items.ingredient", "name unit")
            .sort({ createdAt: -1 });
        res.json(pos);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

const createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, items, totalCost } = req.body;
        const po = await PurchaseOrder.create({
            supplier,
            items,
            totalCost,
            orderedBy: req.user._id
        });
        res.status(201).json(po);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

const fulfillPurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: "PO not found" });
        if (po.status === "delivered") return res.status(400).json({ message: "PO already delivered" });

        // Update ingredient stocks
        for (const item of po.items) {
            await Ingredient.findByIdAndUpdate(item.ingredient, {
                $inc: { stockQuantity: item.quantity }
            });
        }

        po.status = "delivered";
        po.deliveryDate = new Date();
        await po.save();

        res.json(po);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getSuppliers, createSupplier, getPurchaseOrders, createPurchaseOrder, fulfillPurchaseOrder };
