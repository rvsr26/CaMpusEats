const EventOrder = require("../models/EventOrder");
const logger = require("../utils/logger");

// @desc    Request a new catering event
// @route   POST /api/catering
const requestEvent = async (req, res) => {
    try {
        const { eventName, eventDate, guestCount, location, itemsRequested, contactPhone } = req.body;
        const newEvent = await EventOrder.create({
            user: req.user._id,
            eventName,
            eventDate,
            guestCount,
            location,
            itemsRequested,
            contactPhone
        });
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get user's catering requests
// @route   GET /api/catering/my
const getMyEvents = async (req, res) => {
    try {
        const events = await EventOrder.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all catering requests (Admin)
// @route   GET /api/catering/all
const getAllEvents = async (req, res) => {
    try {
        const events = await EventOrder.find().populate("user", "name email role").sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update event status/price (Admin)
// @route   PUT /api/catering/:id
const updateEvent = async (req, res) => {
    try {
        const { status, quotedPrice, adminNotes } = req.body;
        const event = await EventOrder.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (status) event.status = status;
        if (quotedPrice !== undefined) event.quotedPrice = quotedPrice;
        if (adminNotes) event.adminNotes = adminNotes;

        await event.save();
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { requestEvent, getMyEvents, getAllEvents, updateEvent };
