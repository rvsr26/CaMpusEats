const express = require("express");
const router = express.Router();
const {
    getIngredients, createIngredient, updateIngredient, deleteIngredient,
    getRecipes, createOrUpdateRecipe, deleteRecipe,
} = require("../controllers/inventoryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// All inventory routes are admin-only
router.use(protect, adminOnly);

// Ingredients
router.get("/ingredients", getIngredients);
router.post("/ingredients", createIngredient);
router.put("/ingredients/:id", updateIngredient);
router.delete("/ingredients/:id", deleteIngredient);

// Recipes
router.get("/recipes", getRecipes);
router.post("/recipes", createOrUpdateRecipe);
router.delete("/recipes/:id", deleteRecipe);

module.exports = router;
