const Lobby = require("../models/Lobby");
const Order = require("../models/Order");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const MenuItem = require("../models/MenuItem");

// Utility to generate a 6-digit lobby code
const generateLobbyCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Create a new Lobby
// @route   POST /api/lobbies
// @access  Private
exports.createLobby = async (req, res) => {
    try {
        const { canteenId } = req.body;
        if (!canteenId) return res.status(400).json({ message: "Canteen ID is required" });

        // Ensure user is not already hosting an open lobby
        const existingLobby = await Lobby.findOne({ host: req.user.id, status: "open" });
        if (existingLobby) {
            return res.status(400).json({ message: "You already have an open lobby. Please close it first.", code: existingLobby.code });
        }

        const code = generateLobbyCode();
        const lobby = await Lobby.create({
            code,
            host: req.user.id,
            canteen: canteenId,
            participants: [req.user.id],
        });

        res.status(201).json(lobby);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// @desc    Join an existing Lobby
// @route   POST /api/lobbies/join
// @access  Private
exports.joinLobby = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Lobby code is required" });

        const lobby = await Lobby.findOne({ code, status: "open" });
        if (!lobby) return res.status(404).json({ message: "Lobby not found or not open" });

        // Check if already a participant
        if (!lobby.participants.includes(req.user.id)) {
            lobby.participants.push(req.user.id);
            await lobby.save();
        }

        // Populate participants to send back
        await lobby.populate("participants", "name email");

        res.status(200).json(lobby);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// @desc    Get current Lobby details
// @route   GET /api/lobbies/:code
// @access  Private
exports.getLobby = async (req, res) => {
    try {
        const lobby = await Lobby.findOne({ code: req.params.code })
            .populate("participants", "name email")
            .populate("host", "name email")
            .populate({
                path: "cart.user",
                select: "name email"
            });

        if (!lobby) return res.status(404).json({ message: "Lobby not found" });

        res.status(200).json(lobby);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// @desc    Add item to Lobby cart
// @route   POST /api/lobbies/:code/add
// @access  Private
exports.addToLobbyCart = async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;
        const qty = parseInt(quantity, 10);

        if (!menuItemId || qty <= 0) return res.status(400).json({ message: "Valid item ID and quantity required" });

        const lobby = await Lobby.findOne({ code: req.params.code, status: "open" });
        if (!lobby) return res.status(404).json({ message: "Lobby not found or locked" });

        if (!lobby.participants.includes(req.user.id)) {
            return res.status(403).json({ message: "You must join the lobby first" });
        }

        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

        // Check if user already added this identical item
        const existingItemIndex = lobby.cart.findIndex(
            (item) => item.menuItem.toString() === menuItemId && item.user.toString() === req.user.id
        );

        if (existingItemIndex > -1) {
            lobby.cart[existingItemIndex].quantity += qty;
        } else {
            lobby.cart.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: qty,
                user: req.user.id
            });
        }

        await lobby.save();
        await lobby.populate({ path: "cart.user", select: "name email" });

        res.status(200).json(lobby);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// @desc    Remove/update item from Lobby cart
// @route   PUT /api/lobbies/:code/update
// @access  Private
exports.updateLobbyCart = async (req, res) => {
    try {
        const { lobbyItemId, action } = req.body; // action can be 'decrement' or 'remove'

        const lobby = await Lobby.findOne({ code: req.params.code, status: "open" });
        if (!lobby) return res.status(404).json({ message: "Lobby not found or locked" });

        const itemIndex = lobby.cart.findIndex(item => item._id.toString() === lobbyItemId);
        if (itemIndex === -1) return res.status(404).json({ message: "Item not in cart" });

        const item = lobby.cart[itemIndex];

        // Ensure the user trying to modify the item is either the one who added it, or the host
        if (item.user.toString() !== req.user.id && lobby.host.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only modify your own items" });
        }

        if (action === 'decrement' && item.quantity > 1) {
            lobby.cart[itemIndex].quantity -= 1;
        } else {
            // Remove completely
            lobby.cart.splice(itemIndex, 1);
        }

        await lobby.save();
        await lobby.populate({ path: "cart.user", select: "name email" });

        res.status(200).json(lobby);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// @desc    Checkout and Split Bill
// @route   POST /api/lobbies/:code/checkout
// @access  Private
exports.checkoutLobby = async (req, res) => {
    try {
        const lobby = await Lobby.findOne({ code: req.params.code }).populate("participants", "walletBalance");
        if (!lobby) return res.status(404).json({ message: "Lobby not found" });

        if (lobby.host.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the host can checkout" });
        }

        if (lobby.status !== "open") {
            return res.status(400).json({ message: "Lobby is already " + lobby.status });
        }

        if (lobby.cart.length === 0) {
            return res.status(400).json({ message: "Lobby cart is empty" });
        }

        // 1. Calculate individual totals
        const userTotals = {};
        let grandTotal = 0;

        lobby.cart.forEach(item => {
            const userId = item.user.toString();
            const cost = item.price * item.quantity;
            if (!userTotals[userId]) userTotals[userId] = 0;
            userTotals[userId] += cost;
            grandTotal += cost;
        });

        // 2. Verify all users have enough wallet balance
        const participantsData = await User.find({ _id: { $in: Object.keys(userTotals) } });

        for (let user of participantsData) {
            const required = userTotals[user._id.toString()] || 0;
            if (user.walletBalance < required) {
                return res.status(400).json({
                    message: `User ${user.name} has insufficient balance. (Needs ₹${required}, has ₹${user.walletBalance})`
                });
            }
        }

        // 3. Deduct balances and create transactions
        for (let user of participantsData) {
            const required = userTotals[user._id.toString()] || 0;
            if (required > 0) {
                user.walletBalance -= required;
                user.loyaltyPoints += Math.floor(required / 10); // Reward points
                await user.save();

                await WalletTransaction.create({
                    user: user._id,
                    type: "debit",
                    amount: required,
                    balanceAfter: user.walletBalance,
                    description: `Group Order (#${lobby.code})`,
                });
            }
        }

        // 4. Create the final Order linked to the host
        // But the items will contain everything
        const orderItems = lobby.cart.map(item => ({
            menuItem: item.menuItem,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        const newOrder = await Order.create({
            user: lobby.host,
            items: orderItems,
            totalAmount: grandTotal,
            paymentStatus: "paid",
            paymentMethod: "Wallet",
            canteen: lobby.canteen,
            notes: `Group Order (Code: ${lobby.code})`
        });

        // 5. Update Lobby
        lobby.status = "ordered";
        lobby.finalOrderId = newOrder._id;
        await lobby.save();

        res.status(200).json({ message: "Group order placed successfully", orderId: newOrder._id });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
