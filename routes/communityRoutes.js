const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getFeed,
    createPost,
    toggleLike,
    addComment,
    deletePost,
    upload,
    votePoll,
    getLeaderboard,
} = require("../controllers/communityController");

// Public feed
router.get("/", getFeed);
router.get("/leaderboard", getLeaderboard);

router.use(protect);
router.post("/", upload.single("image"), createPost);
router.put("/:id/like", toggleLike);
router.post("/:id/vote", votePoll);
router.post("/:id/comments", addComment);
router.delete("/:id", deletePost);

module.exports = router;
