const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        phone: { type: String, default: "" },
        role: {
            type: String,
            enum: ["student", "staff", "accountant", "manager", "admin", "super-admin"],
            default: "student",
        },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", default: null }, // which canteen this staff/admin manages
        walletBalance: { type: Number, default: 0 },
        loyaltyPoints: { type: Number, default: 0 },
        reputationPoints: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        lastOrderDate: { type: Date, default: null },
        badges: [{ type: String }],
        totalCarbonSaved: { type: Number, default: 0 },
        sustainabilityLevel: { type: Number, default: 1 },
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String, default: null },
        refreshToken: { type: String, default: null },
        walletPin: { type: String, default: null }, // bcrypt-hashed 4-digit PIN
        // Referral System
        referralCode: { type: String, unique: true, sparse: true },
        referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        referralCount: { type: Number, default: 0 },
        referralCredits: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
