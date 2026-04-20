const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Canteen = require("./models/Canteen");

dotenv.config();

const canteens = [
    {
        name: "Main Campus Canteen",
        location: "Block A, Ground Floor",
        image: "https://images.unsplash.com/photo-1567529854338-fc097b962123?q=80&w=800&auto=format&fit=crop",
        rating: 4.5,
        numRatings: 1250,
        avgPrice: 150,
        cuisine: ["North Indian", "South Indian", "Chinese"],
        distance: "200m",
        offers: ["50% OFF up to ₹100", "Free Delivery"],
        isPromoted: true,
        isNew: false,
        isOpen: true,
        openTime: "08:00 AM",
        closeTime: "09:00 PM"
    },
    {
        name: "Tech Park Cafeteria",
        location: "Tech Building, Floor 2",
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop",
        rating: 4.2,
        numRatings: 850,
        avgPrice: 200,
        cuisine: ["Continental", "Italian", "Beverages"],
        distance: "500m",
        offers: ["Flat ₹50 OFF"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "09:00 AM",
        closeTime: "08:00 PM"
    },
    {
        name: "South Side Meals",
        location: "Hostel Block C",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop",
        rating: 4.8,
        numRatings: 2100,
        avgPrice: 100,
        cuisine: ["Authentic South Indian", "Kerala Style"],
        distance: "800m",
        offers: ["Buy 1 Get 1 on Meals"],
        isPromoted: true,
        isNew: false,
        isOpen: true,
        openTime: "07:30 AM",
        closeTime: "10:00 PM"
    },
    {
        name: "The Pizza Hub",
        location: "Student Activity Center",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",
        rating: 4.0,
        numRatings: 450,
        avgPrice: 350,
        cuisine: ["Pizza", "Fast Food", "Shakes"],
        distance: "350m",
        offers: ["Any medium pizza at ₹199"],
        isPromoted: false,
        isNew: true,
        isOpen: true,
        openTime: "11:00 AM",
        closeTime: "11:00 PM"
    },
    {
        name: "Healthy Bites",
        location: "Gymnasium Complex",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
        rating: 4.6,
        numRatings: 620,
        avgPrice: 180,
        cuisine: ["Salads", "Juices", "Healthy Food"],
        distance: "600m",
        offers: ["10% OFF for Gym Members"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "06:00 AM",
        closeTime: "08:00 PM"
    },
    {
        name: "Chai & Chat",
        location: "Library Plaza",
        image: "https://images.unsplash.com/photo-1544787210-282aa5cc493d?q=80&w=800&auto=format&fit=crop",
        rating: 4.3,
        numRatings: 3200,
        avgPrice: 50,
        cuisine: ["Street Food", "Tea", "Coffee"],
        distance: "100m",
        offers: ["Combo starting at ₹49"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "08:00 AM",
        closeTime: "09:30 PM"
    },
    {
        name: "Royal Biryani House",
        location: "Block D, Food Court",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ef4a4f8?q=80&w=800&auto=format&fit=crop",
        rating: 4.7,
        numRatings: 1800,
        avgPrice: 250,
        cuisine: ["Hyderabadi Biryani", "Mughlai"],
        distance: "400m",
        offers: ["Complimentary Dessert"],
        isPromoted: true,
        isNew: false,
        isOpen: true,
        openTime: "12:00 PM",
        closeTime: "10:30 PM"
    },
    {
        name: "Noodle Station",
        location: "Science Block Annex",
        image: "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=800&auto=format&fit=crop",
        rating: 4.1,
        numRatings: 540,
        avgPrice: 120,
        cuisine: ["Thai", "Chinese", "Asian"],
        distance: "300m",
        offers: ["Fixed Lunch Box ₹99"],
        isPromoted: false,
        isNew: true,
        isOpen: true,
        openTime: "10:00 AM",
        closeTime: "07:00 PM"
    },
    {
        name: "Dessert Heaven",
        location: "Shopping Mall",
        image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop",
        rating: 4.9,
        numRatings: 980,
        avgPrice: 150,
        cuisine: ["Desserts", "Ice Cream", "Bakery"],
        distance: "700m",
        offers: ["Buy 2 Get 1 FREE on Scoops"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "10:00 AM",
        closeTime: "10:00 PM"
    },
    {
        name: "The Sandwich Shop",
        location: "Engineering Block entrance",
        image: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?q=80&w=800&auto=format&fit=crop",
        rating: 4.4,
        numRatings: 750,
        avgPrice: 130,
        cuisine: ["Sandwiches", "Wraps", "Fresh Juice"],
        distance: "150m",
        offers: ["Flat 20% OFF on first order"],
        isPromoted: false,
        isNew: true,
        isOpen: true,
        openTime: "08:30 AM",
        closeTime: "08:00 PM"
    },
    {
        name: "The Coffee Bean",
        location: "Academic Block 1, Floor 1",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
        rating: 4.6,
        numRatings: 1100,
        avgPrice: 180,
        cuisine: ["Coffee", "Bakery", "Beverages"],
        distance: "250m",
        offers: ["Free Cookie with Large Coffee"],
        isPromoted: true,
        isNew: true,
        isOpen: true,
        openTime: "08:00 AM",
        closeTime: "08:00 PM"
    },
    {
        name: "Punjabi Tadka",
        location: "International Hostel, Basement",
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop",
        rating: 4.3,
        numRatings: 1540,
        avgPrice: 220,
        cuisine: ["North Indian", "Tandoori"],
        distance: "900m",
        offers: ["Family Thali @ ₹499"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "11:00 AM",
        closeTime: "11:00 PM"
    },
    {
        name: "Momo Central",
        location: "Sports Complex, Near Pool",
        image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b4?q=80&w=800&auto=format&fit=crop",
        rating: 4.5,
        numRatings: 820,
        avgPrice: 100,
        cuisine: ["Tibetan", "Momos", "Asian"],
        distance: "1.2km",
        offers: ["10% OFF after match wins"],
        isPromoted: false,
        isNew: true,
        isOpen: true,
        openTime: "12:00 PM",
        closeTime: "09:00 PM"
    },
    {
        name: "Waffle Wallah",
        location: "Girls Hostel Area, Block G",
        image: "https://images.unsplash.com/photo-1562329265-95a6d7a83440?q=80&w=800&auto=format&fit=crop",
        rating: 4.7,
        numRatings: 630,
        avgPrice: 150,
        cuisine: ["Desserts", "Waffles", "Ice Cream"],
        distance: "750m",
        offers: ["Midnight Special: ₹99 for all Waffles"],
        isPromoted: true,
        isNew: false,
        isOpen: true,
        openTime: "04:00 PM",
        closeTime: "01:00 AM"
    },
    {
        name: "The Salad Bar",
        location: "Medical Center, Ground Floor",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
        rating: 4.2,
        numRatings: 410,
        avgPrice: 200,
        cuisine: ["Healthy Food", "Salads", "Juices"],
        distance: "1.5km",
        offers: ["Diet plan subscription available"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "09:00 AM",
        closeTime: "07:00 PM"
    },
    {
        name: "South Coast Cafe",
        location: "Library Backside, Open Garden",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop",
        rating: 4.8,
        numRatings: 2500,
        avgPrice: 120,
        cuisine: ["South Indian", "Fast Food"],
        distance: "300m",
        offers: ["Student Meal Card Accepted"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "07:00 AM",
        closeTime: "09:00 PM"
    },
    {
        name: "Pizza Pitstop",
        location: "Main Gate, Commercial Hub",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",
        rating: 4.0,
        numRatings: 320,
        avgPrice: 300,
        cuisine: ["Pizza", "Italian"],
        distance: "2.0km",
        offers: ["Free Delivery to Hostels"],
        isPromoted: false,
        isNew: true,
        isOpen: true,
        openTime: "11:00 AM",
        closeTime: "11:30 PM"
    },
    {
        name: "Juice Junction",
        location: "Football Ground, Pavilion",
        image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b4?q=80&w=800&auto=format&fit=crop",
        rating: 4.4,
        numRatings: 940,
        avgPrice: 70,
        cuisine: ["Beverages", "Fresh Juice"],
        distance: "1.1km",
        offers: ["50% OFF on Protein Shakes"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "06:00 AM",
        closeTime: "10:00 PM"
    },
    {
        name: "Rolls King",
        location: "Placement Cell Area, Block H",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800&auto=format&fit=crop",
        rating: 4.5,
        numRatings: 1200,
        avgPrice: 110,
        cuisine: ["North Indian", "Rolls", "Fast Food"],
        distance: "450m",
        offers: ["Grab & Go Combo ₹119"],
        isPromoted: true,
        isNew: false,
        isOpen: true,
        openTime: "10:00 AM",
        closeTime: "10:00 PM"
    },
    {
        name: "Baskin Robbins",
        location: "Mini Mall, Central Hub",
        image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=800&auto=format&fit=crop",
        rating: 4.9,
        numRatings: 3400,
        avgPrice: 200,
        cuisine: ["Ice Cream", "Desserts"],
        distance: "600m",
        offers: ["31% OFF on 31st of every month"],
        isPromoted: false,
        isNew: false,
        isOpen: true,
        openTime: "10:00 AM",
        closeTime: "11:00 PM"
    }
];

const seedCanteens = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🌱 Connected to DB for canteen seeding...");

        // Clear existing canteens if any
        await Canteen.deleteMany({});
        console.log("🗑️ Cleared existing canteens.");

        const canteensWithSlugs = canteens.map(c => ({
            ...c,
            slug: c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        }));

        await Canteen.insertMany(canteensWithSlugs);
        console.log(`✅ ${canteens.length} canteens seeded successfully!`);

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed error:", err.message);
        process.exit(1);
    }
};

seedCanteens();
