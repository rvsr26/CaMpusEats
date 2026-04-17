const express = require("express");
const router = express.Router();
const { createAudit, getAudits } = require("../controllers/safetyController");
const { protect, staffOrAbove } = require("../middleware/authMiddleware");

router.post("/audits", protect, staffOrAbove, createAudit);
router.get("/audits", protect, staffOrAbove, getAudits);

module.exports = router;
