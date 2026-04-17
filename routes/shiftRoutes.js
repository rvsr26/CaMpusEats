const express = require("express");
const router = express.Router();
const { protect, managerOrAbove, staffOrAbove } = require("../middleware/authMiddleware");
const { createShift, getShifts, updateShift, deleteShift, clockIn, clockOut } = require("../controllers/shiftController");

router.use(protect);
router.get("/", staffOrAbove, getShifts);
router.post("/", managerOrAbove, createShift);
router.put("/:id", managerOrAbove, updateShift);
router.delete("/:id", managerOrAbove, deleteShift);
router.put("/:id/clockin", staffOrAbove, clockIn);
router.put("/:id/clockout", staffOrAbove, clockOut);

module.exports = router;
