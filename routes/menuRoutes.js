const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getSearchSuggestions,
    getBusyStatus
} = require("../controllers/menuController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const { menuStorage } = require("../config/cloudinary");
const upload = multer({ storage: menuStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", getMenuItems);
router.get("/suggestions", getSearchSuggestions);
router.get("/status/busy", getBusyStatus);
router.get("/:id", getMenuItemById);
router.post("/", protect, adminOnly, upload.single("image"), createMenuItem);
router.put("/:id", protect, adminOnly, upload.single("image"), updateMenuItem);
router.delete("/:id", protect, adminOnly, deleteMenuItem);

module.exports = router;
