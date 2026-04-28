# 🍽️ CampusEats – Advanced College Canteen Management System

CampusEats is a robust, full-stack management solution designed for college canteens. It streamlines the ordering process for students while providing admins and canteen staff with powerful tools for order management, inventory tracking, and business analytics.

---

## � Key Features

### 👨‍🎓 For Students
- **Smart Menu**: Browse items categorized by type with AI-powered personalized recommendations.
- **Student Wallet**: Secure in-app wallet for quick payments, integration with **Razorpay** for top-ups.
- **Real-time Tracking**: Live order status updates via **Socket.io** and mobile push notifications.
- **Scheduled Pre-orders**: Plan your meals ahead of time with scheduled ordering.
- **QR Code Ordering**: Scan table QR codes for instant digital menu access and seamless ordering.
- **Offline Access**: Progressive Web App (PWA) support for browsing menus even with spotty connectivity.

### 👩‍💼 For Admins & Staff
- **Unified Dashboard**: Comprehensive analytics including revenue trends, top-selling items, and customer insights.
- **Live Queue Management**: Dedicated staff view for real-time order processing (Accept → Prepare → Ready → Complete).
- **Inventory Tracking**: Automated stock management with low-stock alerts and expiration tracking.
- **Dynamic Menu CRUD**: Easy management of menu items, categories, and pricing with Cloudinary-hosted images.
- **Advanced Export**: Export sales and inventory reports in CSV or XLSX formats.
- **AI Insights**: Automated tagging and sentiment analysis of user ratings and feedback.

---

## 🛠️ Tech Stack

### Backend
- **Core**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io for live updates
- **Security**: JWT (Access & Refresh Tokens), Bcrypt.js, Helmet, Express-Rate-Limit
- **Payments**: Razorpay Integration
- **Storage**: Cloudinary (via Multer) for image uploads
- **Task Scheduling**: Node-Cron for pre-orders and automated reports
- **Logging**: Winston for structured application logs

### Frontend
- **Framework**: Next.js 16 (App Router)
- **State Management**: React Context API
- **UI & Styling**: Vanilla CSS (Tailored Dark Theme), Lucide Icons
- **Visualizations**: Recharts for dynamic admin dashboard
- **Networking**: Axios (with custom interceptors)
- **PWA**: Next-PWA for offline support and mobile installability

---

## 🗂️ Project Structure

```text
canteenmangement/
├── server.js            # Backend entry point
├── config/              # Database & passport configurations
├── controllers/         # Business logic (auth, wallet, inventory, orders)
├── models/              # Mongoose schemas
├── routes/              # Express API endpoints
├── middleware/          # JWT, Role-based auth, Error handling
├── utils/               # Helpers, token generators, email service
├── seed.js              # Database seeder (initial users & items)
└── frontend/            # Next.js Application
    ├── public/          # Static assets & PWA manifest
    └── src/
        ├── app/                     # Page routes (App Router)
        │   ├── admin/               # Admin & Staff Portal
        │   │   ├── ai/              # AI Tools (Demand Prediction, Pricing, Recommendations)
        │   │   ├── analytics/       # Advanced Analytics (Trends, Peak Hours, Wastage)
        │   │   ├── canteens/        # Manage Canteens & Stalls
        │   │   ├── delivery-routing/# Delivery Batching & Route Optimization
        │   │   ├── events/          # Event & Catering Management
        │   │   ├── hygiene-checks/  # Quality & Safety Checklists
        │   │   ├── inventory/       # Stock Management
        │   │   ├── kds/             # Smart Kitchen Display (Stations, Timers)
        │   │   ├── notifications/   # Smart Notification Triggers
        │   │   ├── orders/          # Admin Order Timeline
        │   │   ├── pos/             # Point of Sale System
        │   │   ├── preorders/       # Scheduled Orders Management
        │   │   ├── promotions/      # Loyalty Promos & Badges
        │   │   ├── purchase-orders/ # Automated Vendor POs
        │   │   ├── queue/           # Live Queue Management
        │   │   ├── recipes/         # Recipe Management & Costing
        │   │   ├── rewards/         # Admin Rewards Configurations
        │   │   ├── riders/          # Delivery Logistics Management
        │   │   ├── security/        # Fraud & Abuse Detection
        │   │   ├── supplier-payments/# Vendor Ledger
        │   │   ├── support/         # Customer Support
        │   │   ├── temperature-logs/# Food Safety Logs
        │   │   ├── users/           # Roles & Accounts
        │   │   └── vendors/         # Supplier Automation
        │   ├── assistant/           # AI Ordering Chatbot
        │   ├── canteens/            # Public Canteens Listing
        │   ├── cart/                # Shopping Cart
        │   ├── display/             # TV Screen Order Status Tracker
        │   ├── events/              # Bulk Orders & Club Catering
        │   ├── feed/                # Campus Social Feed / Reviews
        │   ├── history/             # User Order History
        │   ├── lobby/               # "Squads" Group Ordering
        │   ├── auth/                # Auth (Login, Register, Passwords)
        │   ├── meal-plans/          # Tiffin Subscriptions
        │   ├── menu/                # Main Ordering UI & Recommendations
        │   ├── nutrition/           # Macro & Calorie Tracking
        │   ├── offline/             # PWA Offline Mode Fallback
        │   ├── orders/              # Live Order Tracking
        │   ├── preorder/            # Schedule Orders for Breaks
        │   ├── profile/             # Profile Settings
        │   ├── queue/               # Student Queue Position Tracker
        │   ├── rewards/             # Loyalty Points, Streaks & Badges
        │   ├── support/             # Helpdesk
        │   ├── voice/               # Voice Ordering Interface
        │   ├── wallet/              # User Wallet
        │   └── page.tsx             # Student Dashboard (Home)
        ├── components/              # High-quality UI components
        ├── context/                 # Global state (Auth, Wallet, Notification)
        └── services/                # API abstraction layer
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image uploads)
- Razorpay account (for payments)

### 2. Backend Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
RAZORPAY_KEY_ID=your_rzp_id
RAZORPAY_KEY_SECRET=your_rzp_secret
```

### 3. Installation
```bash
# Install dependencies for both backend and frontend
npm install
cd frontend && npm install
```

### 4. Database Seeding
```bash
# From the root directory
npm run seed
```
*Creates: Admin (admin@canteen.com/admin123) and Student (student@canteen.com/student123)*

### 5. Running the Application
```bash
# Run backend (Root)
npm run dev

# Run frontend (frontend directory)
npm run dev
```

---

## 🔌 Core API Endpoints

| Category | Endpoint | Method | Auth |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | POST | Public |
| **Menu** | `/api/menu` | GET | Public |
| **Orders** | `/api/orders` | POST | Student |
| **Wallet** | `/api/wallet/balance`| GET | Student |
| **Admin** | `/api/analytics/summary`| GET | Admin |
| **Staff** | `/api/orders/all` | GET | Admin/Staff |

---

## �️ License
Distributed under the MIT License. See `LICENSE` for more information.
