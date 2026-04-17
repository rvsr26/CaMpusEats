const TableReservation = require("../models/TableReservation");
const { hasRole } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

// @route  POST /api/reservations
const createReservation = async (req, res) => {
    try {
        const { canteen, tableNumber, date, timeSlot, partySize } = req.body;
        if (!canteen || !tableNumber || !date || !timeSlot || !partySize) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check for conflicting reservation
        const conflict = await TableReservation.findOne({
            canteen, tableNumber,
            date: new Date(date),
            timeSlot,
            status: { $in: ["pending", "confirmed"] },
        });
        if (conflict) return res.status(409).json({ message: "Table already reserved for this time slot" });

        const reservation = await TableReservation.create({
            user: req.user._id,
            canteen, tableNumber,
            date: new Date(date),
            timeSlot, partySize,
        });
        await reservation.populate("canteen", "name location");
        res.status(201).json(reservation);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/reservations  — my reservations (student) or all (staff+)
const getReservations = async (req, res) => {
    try {
        const isStaff = hasRole(req.user, "staff");
        const filter = isStaff ? {} : { user: req.user._id };
        if (req.query.canteen) filter.canteen = req.query.canteen;
        if (req.query.date) filter.date = new Date(req.query.date);
        if (req.query.status) filter.status = req.query.status;

        const reservations = await TableReservation.find(filter)
            .populate("user", "name email phone")
            .populate("canteen", "name location")
            .sort({ date: 1, timeSlot: 1 });
        res.json(reservations);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/reservations/:id
const getReservationById = async (req, res) => {
    try {
        const reservation = await TableReservation.findById(req.params.id)
            .populate("user", "name email")
            .populate("canteen", "name location");
        if (!reservation) return res.status(404).json({ message: "Reservation not found" });

        const isOwner = reservation.user._id.toString() === req.user._id.toString();
        if (!isOwner && !hasRole(req.user, "staff")) {
            return res.status(403).json({ message: "Not authorized" });
        }
        res.json(reservation);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/reservations/:id  — update status (staff) or cancel (user)
const updateReservation = async (req, res) => {
    try {
        const reservation = await TableReservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: "Reservation not found" });

        const isOwner = reservation.user.toString() === req.user._id.toString();
        const isStaff = hasRole(req.user, "staff");

        if (!isOwner && !isStaff) return res.status(403).json({ message: "Not authorized" });

        // Users can only cancel their own reservation
        if (isOwner && !isStaff) {
            if (req.body.status && req.body.status !== "cancelled") {
                return res.status(403).json({ message: "Users can only cancel reservations" });
            }
        }

        const updated = await TableReservation.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        ).populate("user", "name email").populate("canteen", "name location");
        res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  DELETE /api/reservations/:id  — staff+
const deleteReservation = async (req, res) => {
    try {
        const reservation = await TableReservation.findByIdAndDelete(req.params.id);
        if (!reservation) return res.status(404).json({ message: "Reservation not found" });
        res.json({ message: "Reservation deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createReservation, getReservations, getReservationById, updateReservation, deleteReservation };
