const express = require("express");
const router = express.Router();
const {
    createOrder, createGuestOrder, getStaffOrders, getMyOrders, getAllOrders, getOrderById, updateOrderStatus, cancelOrder, getOrderQueueStatus
} = require("../controllers/orderController");
const { placePOSOrder } = require("../controllers/posController");
const { protect, managerOrAbove, staffOrAbove } = require("../middleware/authMiddleware");

router.post("/create", protect, createOrder);
router.post("/guest", createGuestOrder); // Public — kiosk/walk-up (no auth)
router.post("/pos", protect, staffOrAbove, placePOSOrder);
router.get("/", protect, getMyOrders);
router.get("/staff", protect, staffOrAbove, getStaffOrders); // Staff/manager KDS
router.get("/all", protect, managerOrAbove, getAllOrders);
router.get("/:id", protect, getOrderById);
router.get("/:id/queue-status", protect, getOrderQueueStatus);
router.put("/:id/status", protect, staffOrAbove, updateOrderStatus);
router.put("/:id/cancel", protect, cancelOrder);

module.exports = router;
