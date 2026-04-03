const mongoose = require("mongoose");

const canteenSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true }, // e.g. "Main Cafeteria"
        slug: { type: String, required: true, unique: true, lowercase: true }, // e.g. "main-cafeteria"
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        location: { type: String, default: "" }, // e.g. "Block A, Ground Floor"
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: "08:00" }, // HH:MM
        closeTime: { type: String, default: "20:00" },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        numRatings: { type: Number, default: 0 },
        avgPrice: { type: Number, default: 0 }, // for two people
        cuisine: [{ type: String }], // e.g. ["South Indian", "Chinese"]
        distance: { type: String, default: "" }, // e.g. "1.2 km"
        offers: [{ type: String }], // e.g. ["Flat 10% OFF"]
        isPromoted: { type: Boolean, default: false },
        isNew: { type: Boolean, default: false },
        managers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // admin users for this canteen
        sortOrder: { type: Number, default: 0 }, // display order
    },
    { timestamps: true }
);

module.exports = mongoose.model("Canteen", canteenSchema);
