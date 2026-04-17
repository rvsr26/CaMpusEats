const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    createGroupOrder,
    joinGroupOrder,
    getGroupOrder,
    addItem,
    lockGroupOrder,
    getMyGroupOrders,
} = require("../controllers/groupOrderController");

router.use(protect);
router.get("/", getMyGroupOrders);
router.post("/", createGroupOrder);
router.get("/:shareLink", getGroupOrder);
router.post("/join/:shareLink", joinGroupOrder);
router.post("/:shareLink/items", addItem);
router.put("/:shareLink/lock", lockGroupOrder);

module.exports = router;
