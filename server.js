const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { startCronJobs } = require("./utils/cronJobs");

dotenv.config();
connectDB();

const app = express();

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Managed separately for Next.js
}));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001").split(",");
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploads as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route imports
const safetyRoutes = require("./routes/safetyRoutes");
const vendorRoutes = require("./routes/vendorRoutes"); // Added vendorRoutes import

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/catering", require("./routes/cateringRoutes"));
app.use("/api/safety", safetyRoutes);
app.use("/api/vendor", vendorRoutes); // Standardized to singular
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/recommendations", require("./routes/recommendationRoutes"));
app.use("/api/canteens", require("./routes/canteenRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/forecast", require("./routes/forecastRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/pricing", require("./routes/pricingRoutes"));
app.use("/api/lobbies", require("./routes/lobbyRoutes"));
app.use("/api/kds", require("./routes/kdsRoutes"));
app.use("/api/meal-plans", require("./routes/mealPlanRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
// New Feature Routes
app.use("/api/reservations", require("./routes/tableReservationRoutes"));
app.use("/api/group-orders", require("./routes/groupOrderRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/queue", require("./routes/queueRoutes"));
app.use("/api/performance", require("./routes/performanceRoutes"));
app.use("/api/referral", require("./routes/referralRoutes"));
app.use("/api/community", require("./routes/communityRoutes"));
app.use("/api/shifts", require("./routes/shiftRoutes"));
// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Canteen API is running 🍔", time: new Date() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5005;
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.set("io", io);

io.on("connection", (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    socket.on("join", (userId) => {
        socket.join(userId);
        logger.info(`👤 User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Start cron jobs
startCronJobs();

server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
});
