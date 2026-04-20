const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const MenuItem = require("./models/MenuItem");

dotenv.config();

const menuItems = [
    { name: "Veg Puff", category: "Snacks", price: 20, isVeg: true, description: "Crispy flaky puff with spiced potato filling", preparationTime: 5 },
    { name: "Egg Puff", category: "Snacks", price: 25, isVeg: false, description: "Crispy puff with boiled egg filling", preparationTime: 5 },
    { name: "Masala Dosa", category: "Meals", price: 50, isVeg: true, description: "Crispy rice crepe with spiced potato filling and chutney", preparationTime: 15 },
    { name: "Idli (2 pcs)", category: "Meals", price: 30, isVeg: true, description: "Steamed rice cakes served with sambar and chutney", preparationTime: 10 },
    { name: "Veg Sandwich", category: "Fast Food", price: 40, isVeg: true, description: "Toasted bread with fresh veggies and spread", preparationTime: 8 },
    { name: "Chicken Sandwich", category: "Fast Food", price: 60, isVeg: false, description: "Toasted bread with grilled chicken", preparationTime: 10 },
    { name: "Veg Burger", category: "Fast Food", price: 65, isVeg: true, description: "Aloo tikki burger with fresh toppings", preparationTime: 10 },
    { name: "Chicken Burger", category: "Fast Food", price: 85, isVeg: false, description: "Crispy chicken patty burger", preparationTime: 12 },
    { name: "Samosa (2 pcs)", category: "Snacks", price: 20, isVeg: true, description: "Fried snack with spiced potato filling", preparationTime: 5 },
    { name: "Veg Noodles", category: "Fast Food", price: 55, isVeg: true, description: "Hakka style vegetable noodles", preparationTime: 12 },
    { name: "Tea", category: "Beverages", price: 15, isVeg: true, description: "Hot masala chai", preparationTime: 3 },
    { name: "Coffee", category: "Beverages", price: 20, isVeg: true, description: "Fresh brewed filter coffee", preparationTime: 3 },
    { name: "Cold Drink (Bottle)", category: "Beverages", price: 30, isVeg: true, description: "Chilled soft drink 500ml", preparationTime: 1 },
    { name: "Fresh Juice", category: "Beverages", price: 40, isVeg: true, description: "Seasonal fresh fruit juice", preparationTime: 5 },
    { name: "Gulab Jamun (2 pcs)", category: "Desserts", price: 30, isVeg: true, description: "Soft khoya balls in sugar syrup", preparationTime: 3 },
    { name: "Ice Cream", category: "Desserts", price: 40, isVeg: true, description: "Creamy vanilla/chocolate ice cream scoop", preparationTime: 2 },
    { name: "Thali (Full Meal)", category: "Meals", price: 80, isVeg: true, description: "Rice, 2 roti, dal, sabzi, raita, papad", preparationTime: 20 },
    { name: "Egg Biryani", category: "Meals", price: 70, isVeg: false, description: "Fragrant basmati rice with spiced egg curry", preparationTime: 20 },
];

const seed = async () => {
    try {
        await connectDB();
        console.log("🌱 Seeding database...");

        // Clear existing data
        await MenuItem.deleteMany({});
        await User.deleteMany({});

        // Create admin user
        const admin = await User.create({
            name: "Canteen Admin",
            email: "admin@canteen.com",
            password: "admin123",
            role: "admin",
            phone: "9000000000",
        });
        console.log(`✅ Admin created: ${admin.email} / password: admin123`);

        // Create sample student
        const student = await User.create({
            name: "Vishnu Kumar",
            email: "vishnu@student.com",
            password: "student123",
            role: "student",
            phone: "9876543210",
        });
        console.log(`✅ Student created: ${student.email} / password: student123`);

        // Insert menu items
        await MenuItem.insertMany(menuItems);
        console.log(`✅ ${menuItems.length} menu items seeded`);

        console.log("\n🎉 Database seeded successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Admin Login:   admin@canteen.com / admin123");
        console.log("Student Login: vishnu@student.com / student123");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed error:", err.message);
        process.exit(1);
    }
};

seed();
