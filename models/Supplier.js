const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        contactPerson: { type: String },
        email: { type: String },
        phone: { type: String, required: true },
        address: { type: String },
        categories: [{ type: String }], // e.g. ["Vegetables", "Dairy", "Meat"]
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
