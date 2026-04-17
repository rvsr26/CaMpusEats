const SafetyAudit = require("../models/SafetyAudit");

// @desc    Log a new safety audit
// @route   POST /api/safety/audits
const createAudit = async (req, res) => {
    try {
        const { canteen, type, itemsInspected, status, notes, actionTaken } = req.body;
        const audit = await SafetyAudit.create({
            canteen,
            auditor: req.user._id,
            type,
            itemsInspected,
            status,
            notes,
            actionTaken
        });
        res.status(201).json(audit);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all safety audits
// @route   GET /api/safety/audits
const getAudits = async (req, res) => {
    try {
        const audits = await SafetyAudit.find()
            .populate("auditor", "name role")
            .populate("canteen", "name")
            .sort({ createdAt: -1 });
        res.json(audits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createAudit, getAudits };
