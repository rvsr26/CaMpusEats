const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");

// @desc   Get user's cart
// @route  GET /api/cart
const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.menuItem", "name price image availability");
        if (!cart) return res.json({ items: [], totalAmount: 0 });
        const totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        res.json({ items: cart.items, totalAmount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Add item to cart
// @route  POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;
        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) return res.status(404).json({ message: "Menu item not found" });
        if (!menuItem.availability) return res.status(400).json({ message: "Item not available" });

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) cart = new Cart({ user: req.user._id, items: [] });

        const existingIndex = cart.items.findIndex((i) => i.menuItem.toString() === menuItemId);
        if (existingIndex > -1) {
            cart.items[existingIndex].quantity += quantity || 1;
        } else {
            cart.items.push({ menuItem: menuItemId, quantity: quantity || 1, price: menuItem.price });
        }
        await cart.save();
        const populated = await Cart.findById(cart._id).populate("items.menuItem", "name price image");
        const totalAmount = populated.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        res.status(201).json({ items: populated.items, totalAmount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Update item quantity in cart
// @route  PUT /api/cart/update
const updateCartItem = async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.find((i) => i.menuItem.toString() === menuItemId);
        if (!item) return res.status(404).json({ message: "Item not in cart" });

        if (quantity <= 0) {
            cart.items = cart.items.filter((i) => i.menuItem.toString() !== menuItemId);
        } else {
            item.quantity = quantity;
        }
        await cart.save();
        const populated = await Cart.findById(cart._id).populate("items.menuItem", "name price image");
        const totalAmount = populated.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        res.json({ items: populated.items, totalAmount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Remove item from cart
// @route  DELETE /api/cart/remove/:menuItemId
const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
        cart.items = cart.items.filter((i) => i.menuItem.toString() !== req.params.menuItemId);
        await cart.save();
        const populated = await Cart.findById(cart._id).populate("items.menuItem", "name price image");
        const totalAmount = populated.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        res.json({ items: populated.items, totalAmount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Clear entire cart
// @route  DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
        res.json({ message: "Cart cleared", items: [], totalAmount: 0 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
