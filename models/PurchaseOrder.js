const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
    {
        supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
        items: [
            {
                ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
                quantity: { type: Number, required: true },
                costPrice: { type: Number, required: true },
            }
        ],
        totalCost: { type: Number, required: true },
        status: {
            type: String,
            enum: ["ordered", "delivered", "cancelled"],
            default: "ordered"
        },
        deliveryDate: { type: Date },
        orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
