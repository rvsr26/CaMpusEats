const Ingredient = require("../models/Ingredient");
const Recipe = require("../models/Recipe");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendLowStockAlert } = require("../utils/emailService");
const logger = require("../utils/logger");

// ─── INGREDIENTS ────────────────────────────────────────────────────────────

// @route  GET /api/inventory/ingredients
const getIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find().sort({ name: 1 });
        // Annotate with isLow flag
        const result = ingredients.map((i) => ({
            ...i.toObject(),
            isLow: i.stockQty <= i.lowStockThreshold,
            isCritical: i.stockQty === 0,
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route  POST /api/inventory/ingredients
const createIngredient = async (req, res) => {
    try {
        const { name, unit, stockQty, lowStockThreshold, costPerUnit } = req.body;
        if (!name) return res.status(400).json({ message: "Name is required" });
        const ingredient = await Ingredient.create({ name, unit, stockQty, lowStockThreshold, costPerUnit });
        res.status(201).json(ingredient);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Ingredient already exists" });
        res.status(500).json({ message: err.message });
    }
};

// @route  PUT /api/inventory/ingredients/:id
const updateIngredient = async (req, res) => {
    try {
        const { stockQty, lowStockThreshold, costPerUnit, name, unit } = req.body;
        const ingredient = await Ingredient.findById(req.params.id);
        if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });
        if (name !== undefined) ingredient.name = name;
        if (unit !== undefined) ingredient.unit = unit;
        if (stockQty !== undefined) ingredient.stockQty = stockQty;
        if (lowStockThreshold !== undefined) ingredient.lowStockThreshold = lowStockThreshold;
        if (costPerUnit !== undefined) ingredient.costPerUnit = costPerUnit;
        await ingredient.save();
        res.json(ingredient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route  DELETE /api/inventory/ingredients/:id
const deleteIngredient = async (req, res) => {
    try {
        await Ingredient.findByIdAndDelete(req.params.id);
        res.json({ message: "Ingredient deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── RECIPES ────────────────────────────────────────────────────────────────

// @route  GET /api/inventory/recipes
const getRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate("menuItem", "name category image")
            .populate("ingredients.ingredient", "name unit");
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route  POST /api/inventory/recipes
const createOrUpdateRecipe = async (req, res) => {
    try {
        const { menuItem, ingredients } = req.body;
        if (!menuItem || !ingredients?.length) {
            return res.status(400).json({ message: "menuItem and ingredients required" });
        }
        const recipe = await Recipe.findOneAndUpdate(
            { menuItem },
            { menuItem, ingredients },
            { upsert: true, new: true }
        ).populate("menuItem", "name").populate("ingredients.ingredient", "name unit");
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route  DELETE /api/inventory/recipes/:id
const deleteRecipe = async (req, res) => {
    try {
        await Recipe.findByIdAndDelete(req.params.id);
        res.json({ message: "Recipe deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── INVENTORY DEDUCTION (called by orderController) ─────────────────────────

/**
 * Deduct ingredients for all items in an order.
 * Emits lowStock socket events and sends email alert if any ingredient is low.
 * @param {Array} orderItems  - [{menuItem: ObjectId, quantity: Number}, ...]
 * @param {Object} io         - Socket.io server instance
 */
const deductIngredients = async (orderItems, io) => {
    try {
        const lowStockWarnings = [];

        for (const item of orderItems) {
            const recipe = await Recipe.findOne({ menuItem: item.menuItem }).populate("ingredients.ingredient");
            if (!recipe) continue; // No recipe defined for this item — skip

            for (const { ingredient, qty } of recipe.ingredients) {
                const deductAmount = qty * item.quantity;
                const updated = await Ingredient.findByIdAndUpdate(
                    ingredient._id,
                    { $inc: { stockQty: -deductAmount } },
                    { new: true }
                );

                if (updated && updated.stockQty <= updated.lowStockThreshold) {
                    lowStockWarnings.push(updated);
                }
            }
        }

        if (lowStockWarnings.length > 0) {
            // Emit to admin socket room
            if (io) io.emit("lowStock", lowStockWarnings);

            // Create admin notification in DB
            const admins = await User.find({ role: "admin" }, "_id email");
            for (const admin of admins) {
                await Notification.create({
                    user: admin._id,
                    title: "⚠️ Low Stock Alert",
                    message: `${lowStockWarnings.length} ingredient(s) are running low: ${lowStockWarnings.map(w => `${w.name} (${w.stockQty} ${w.unit} left)`).join(", ")}`,
                    type: "system",
                });
                if (io) io.to(admin._id.toString()).emit("notification", { type: "lowStock", items: lowStockWarnings });
            }

            // Email alert (if email is configured)
            try {
                const adminEmails = admins.map(a => a.email);
                await sendLowStockAlert(adminEmails, lowStockWarnings);
            } catch (mailErr) {
                logger.warn("Low stock email failed:", mailErr.message);
            }
        }
    } catch (err) {
        logger.error("deductIngredients error:", err.message);
    }
};

/**
 * Restore ingredients when an order is cancelled.
 */
const restoreIngredients = async (orderItems) => {
    try {
        for (const item of orderItems) {
            const recipe = await Recipe.findOne({ menuItem: item.menuItem }).populate("ingredients.ingredient");
            if (!recipe) continue;
            for (const { ingredient, qty } of recipe.ingredients) {
                await Ingredient.findByIdAndUpdate(ingredient._id, {
                    $inc: { stockQty: qty * item.quantity },
                });
            }
        }
    } catch (err) {
        logger.error("restoreIngredients error:", err.message);
    }
};

module.exports = {
    getIngredients, createIngredient, updateIngredient, deleteIngredient,
    getRecipes, createOrUpdateRecipe, deleteRecipe,
    deductIngredients, restoreIngredients,
};
