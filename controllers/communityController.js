const CommunityPost = require("../models/CommunityPost");
const User = require("../models/User");
const { hasRole } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer config for community post images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../uploads/community");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `post_${Date.now()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// @route  GET /api/community  — public paginated feed
const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.canteen) filter.canteen = req.query.canteen;
        if (req.query.tag) filter.tags = req.query.tag;

        const [posts, total] = await Promise.all([
            CommunityPost.find(filter)
                .populate("user", "name reputationPoints badges")
                .populate("menuItem", "name image price")
                .populate("canteen", "name")
                .populate("comments.user", "name reputationPoints badges")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CommunityPost.countDocuments(filter),
        ]);

        res.json({ posts, total, page, pages: Math.ceil(total / limit) });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/community  — create post (with optional image)
const createPost = async (req, res) => {
    try {
        const { caption, canteen, menuItem, tags, type, pollQuestion, pollOptions } = req.body;
        const imageUrl = req.file ? req.file.path : undefined;

        const postData = {
            user: req.user._id,
            caption,
            canteen: canteen || undefined,
            menuItem: menuItem || undefined,
            imageUrl,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim())) : [],
            type: type || "post",
        };

        if (type === "poll") {
            postData.poll = {
                question: pollQuestion,
                options: JSON.parse(pollOptions || "[]").map(opt => ({ text: opt, votes: [] })),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h default
            };
        }

        const post = await CommunityPost.create(postData);
        
        // Reward for posting
        await User.findByIdAndUpdate(req.user._id, { $inc: { reputationPoints: 10 } });

        await post.populate("user", "name reputationPoints badges");
        res.status(201).json(post);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  PUT /api/community/:id/like  — toggle like
const toggleLike = async (req, res) => {
    try {
        const post = await CommunityPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user._id.toString();
        const isLiked = post.likes.some(id => id.toString() === userId);

        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId);
            // Deduct reputation
            await User.findByIdAndUpdate(post.user, { $inc: { reputationPoints: -2 } });
        } else {
            post.likes.push(req.user._id);
            // Reward reputation
            await User.findByIdAndUpdate(post.user, { $inc: { reputationPoints: 2 } });
        }
        await post.save();
        res.json({ liked: !isLiked, likesCount: post.likes.length });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/community/:id/comments  — add comment
const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: "Comment text required" });

        const post = await CommunityPost.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { user: req.user._id, text: text.trim() } } },
            { new: true }
        ).populate("comments.user", "name reputationPoints badges");
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Reward for commenting
        await User.findByIdAndUpdate(req.user._id, { $inc: { reputationPoints: 2 } });

        res.json(post.comments[post.comments.length - 1]);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  DELETE /api/community/:id  — delete own post (or admin)
const deletePost = async (req, res) => {
    try {
        const post = await CommunityPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const isOwner = post.user.toString() === req.user._id.toString();
        if (!isOwner && !hasRole(req.user, "admin")) {
            return res.status(403).json({ message: "Not authorized" });
        }
        await post.deleteOne();
        res.json({ message: "Post deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  POST /api/community/:id/vote  — vote on poll
const votePoll = async (req, res) => {
    try {
        const { optionIndex } = req.body;
        const post = await CommunityPost.findById(req.params.id);
        if (!post || post.type !== "poll") return res.status(404).json({ message: "Poll not found" });

        // Check if user already voted
        const alreadyVoted = post.poll.options.some(opt => opt.votes.some(id => id.toString() === req.user._id.toString()));
        if (alreadyVoted) return res.status(400).json({ message: "Already voted" });

        post.poll.options[optionIndex].votes.push(req.user._id);
        await post.save();
        
        // Reward for voting
        await User.findByIdAndUpdate(req.user._id, { $inc: { reputationPoints: 1 } });
        
        res.json(post);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// @route  GET /api/community/leaderboard  — get top users
const getLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.find()
            .sort({ reputationPoints: -1 })
            .limit(10)
            .select("name email reputationPoints badges");
        res.json(topUsers);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getFeed, createPost, toggleLike, addComment, deletePost, upload, votePoll, getLeaderboard };
