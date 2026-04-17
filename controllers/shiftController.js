const Shift = require("../models/Shift");
const { hasRole } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

// @route  POST /api/shifts  — manager creates shift
const createShift = async (req, res) => {
    try {
        if (!hasRole(req.user, "manager")) return res.status(403).json({ message: "Manager access required" });

        const { staff, canteen, date, startTime, endTime, role, notes } = req.body;
        if (!staff || !canteen || !date || !startTime || !endTime || !role) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        const shift = await Shift.create({ staff, canteen, date: new Date(date), startTime, endTime, role, notes });
        await shift.populate("staff", "name email role");
        res.status(201).json(shift);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/shifts  — list shifts by canteen/date/user
const getShifts = async (req, res) => {
    try {
        const filter = {};
        
        // Regular staff see only their own shifts
        if (!hasRole(req.user, "manager")) {
            filter.staff = req.user._id;
        } else {
            if (req.query.canteen) filter.canteen = req.query.canteen;
            else if (req.user.canteen) filter.canteen = req.user.canteen;
        }

        if (req.query.date) filter.date = new Date(req.query.date);
        if (req.query.week) {
            const start = new Date(req.query.week);
            const end = new Date(start);
            end.setDate(end.getDate() + 7);
            filter.date = { $gte: start, $lt: end };
        }
        if (req.query.staff) filter.staff = req.query.staff;

        const shifts = await Shift.find(filter)
            .populate("staff", "name email role phone")
            .populate("canteen", "name location")
            .sort({ date: 1, startTime: 1 });
        res.json(shifts);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/shifts/:id  — update shift
const updateShift = async (req, res) => {
    try {
        if (!hasRole(req.user, "manager")) return res.status(403).json({ message: "Manager access required" });

        const shift = await Shift.findByIdAndUpdate(
            req.params.id, req.body, { new: true, runValidators: true }
        ).populate("staff", "name email role");
        if (!shift) return res.status(404).json({ message: "Shift not found" });
        res.json(shift);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  DELETE /api/shifts/:id  — manager deletes shift
const deleteShift = async (req, res) => {
    try {
        if (!hasRole(req.user, "manager")) return res.status(403).json({ message: "Manager access required" });
        const shift = await Shift.findByIdAndDelete(req.params.id);
        if (!shift) return res.status(404).json({ message: "Shift not found" });
        res.json({ message: "Shift deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/shifts/:id/clockin  — staff clocks in
const clockIn = async (req, res) => {
    try {
        const shift = await Shift.findOne({ _id: req.params.id, staff: req.user._id });
        if (!shift) return res.status(404).json({ message: "Shift not found" });
        shift.status = "ongoing";
        shift.clockInTime = new Date();
        await shift.save();
        res.json(shift);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/shifts/:id/clockout  — staff clocks out
const clockOut = async (req, res) => {
    try {
        const shift = await Shift.findOne({ _id: req.params.id, staff: req.user._id });
        if (!shift) return res.status(404).json({ message: "Shift not found" });
        shift.status = "completed";
        shift.clockOutTime = new Date();
        await shift.save();
        res.json(shift);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createShift, getShifts, updateShift, deleteShift, clockIn, clockOut };
