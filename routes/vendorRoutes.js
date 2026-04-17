const express = require("express");
const router = express.Router();
const { getSuppliers, createSupplier, getPurchaseOrders, createPurchaseOrder, fulfillPurchaseOrder } = require("../controllers/vendorController");
const { protect, staffOrAbove } = require("../middleware/authMiddleware");

router.get("/suppliers", protect, staffOrAbove, getSuppliers);
router.post("/suppliers", protect, staffOrAbove, createSupplier);
router.get("/purchase-orders", protect, staffOrAbove, getPurchaseOrders);
router.post("/purchase-orders", protect, staffOrAbove, createPurchaseOrder);
router.put("/purchase-orders/:id/fulfill", protect, staffOrAbove, fulfillPurchaseOrder);

module.exports = router;
