const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true, trim: true, maxlength: 300 },
    },
    { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", default: null },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", default: null },
        caption: { type: String, trim: true, maxlength: 500 },
        imageUrl: { type: String, required: true },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        comments: [commentSchema],
        tags: [{ type: String }],
        isApproved: { type: Boolean, default: true }, // admin can hide if needed
        likesCount: { type: Number, default: 0 },
        type: { type: String, enum: ["post", "poll"], default: "post" },
        poll: {
            question: { type: String },
            options: [{
                text: { type: String },
                votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
            }],
            expiresAt: { type: Date }
        }
    },
    { timestamps: true }
);

// Sync likesCount with likes array length on save
communityPostSchema.pre("save", function () {
    this.likesCount = this.likes.length;
});

module.exports = mongoose.model("CommunityPost", communityPostSchema);
