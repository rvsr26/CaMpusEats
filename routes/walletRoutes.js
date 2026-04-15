const express = require("express");
const router = express.Router();
const { rechargeWallet, getBalance, getTransactions, redeemPoints } = require("../controllers/walletController");
const { setWalletPin, getPinStatus, transferWallet, getTransferHistory } = require("../controllers/transferController");
const { protect } = require("../middleware/authMiddleware");
const { validateRecharge } = require("../middleware/validationMiddleware");

router.post("/recharge", protect, validateRecharge, rechargeWallet);
router.get("/balance", protect, getBalance);
router.get("/transactions", protect, getTransactions);
router.post("/redeem-points", protect, redeemPoints);

// Wallet Transfer
router.get("/pin-status", protect, getPinStatus);
router.post("/set-pin", protect, setWalletPin);
router.post("/transfer", protect, transferWallet);
router.get("/transfer-history", protect, getTransferHistory);

module.exports = router;
