const express = require("express");
const router = express.Router();
const {
    createLobby,
    joinLobby,
    getLobby,
    addToLobbyCart,
    updateLobbyCart,
    checkoutLobby
} = require("../controllers/lobbyController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createLobby);
router.post("/join", protect, joinLobby);
router.get("/:code", protect, getLobby);
router.post("/:code/add", protect, addToLobbyCart);
router.put("/:code/update", protect, updateLobbyCart);
router.post("/:code/checkout", protect, checkoutLobby);

module.exports = router;
