const express = require("express");
const router = express.Router();
const { protect, staffOrAbove } = require("../middleware/authMiddleware");
const {
    createReservation,
    getReservations,
    getReservationById,
    updateReservation,
    deleteReservation,
} = require("../controllers/tableReservationController");

router.use(protect);
router.get("/", getReservations);
router.post("/", createReservation);
router.get("/:id", getReservationById);
router.put("/:id", updateReservation);
router.delete("/:id", staffOrAbove, deleteReservation);

module.exports = router;
