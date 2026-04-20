const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const Canteen = require('./models/Canteen');

const baseImages = {
  "Burger": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200000/canteen/classic-veg-burger.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200001/canteen/chicken-zinger.jpg"],
  "Pizza": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200002/canteen/margherita-pizza.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200003/canteen/pepperoni-pizza.jpg"],
  "South Indian": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200004/canteen/masala-dosa.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200019/canteen/idli-sambar.jpg"],
  "North Indian": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200005/canteen/paneer-butter-masala.jpg"],
  "Biryani": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200006/canteen/chicken-biryani.jpg"],
  "Chinese": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200007/canteen/veg-hakka-noodles.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200015/canteen/egg-fried-rice.jpg"],
  "Beverage": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200008/canteen/cold-coffee.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200009/canteen/fresh-lime-soda.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200016/canteen/mango-smoothie.jpg"],
  "Dessert": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200010/canteen/chocolate-brownie.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200011/canteen/gulab-jamun.jpg"],
  "Snack": ["https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200012/canteen/grilled-sandwich.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200013/canteen/french-fries.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200014/canteen/samosa.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200017/canteen/veg-roll.jpg", "https://res.cloudinary.com/dyqfrowxw/image/upload/v1710200018/canteen/chicken-roll.jpg"]
};

// Base items to mix and match
const bases = [
  { name: "Burger", type: "Fast Food", station: "Fast Food", isVeg: true, catImg: "Burger" },
  { name: "Pizza", type: "Fast Food", station: "Fast Food", isVeg: true, catImg: "Pizza" },
  { name: "Dosa", type: "Meals", station: "Main Course", isVeg: true, catImg: "South Indian" },
  { name: "Idli", type: "Meals", station: "General", isVeg: true, catImg: "South Indian" },
  { name: "Paneer Curry", type: "Meals", station: "Main Course", isVeg: true, catImg: "North Indian" },
  { name: "Biryani", type: "Meals", station: "Main Course", isVeg: false, catImg: "Biryani" },
  { name: "Noodles", type: "Fast Food", station: "Fast Food", isVeg: true, catImg: "Chinese" },
  { name: "Fried Rice", type: "Meals", station: "Main Course", isVeg: true, catImg: "Chinese" },
  { name: "Coffee", type: "Beverages", station: "Beverages", isVeg: true, catImg: "Beverage" },
  { name: "Tea", type: "Beverages", station: "Beverages", isVeg: true, catImg: "Beverage" },
  { name: "Soda", type: "Beverages", station: "Beverages", isVeg: true, catImg: "Beverage" },
  { name: "Smoothie", type: "Beverages", station: "Beverages", isVeg: true, catImg: "Beverage" },
  { name: "Brownie", type: "Desserts", station: "Desserts", isVeg: true, catImg: "Dessert" },
  { name: "Ice Cream", type: "Desserts", station: "Desserts", isVeg: true, catImg: "Dessert" },
  { name: "Gulab Jamun", type: "Desserts", station: "Desserts", isVeg: true, catImg: "Dessert" },
  { name: "Sandwich", type: "Snacks", station: "Grill", isVeg: true, catImg: "Snack" },
  { name: "Fries", type: "Snacks", station: "Fast Food", isVeg: true, catImg: "Snack" },
  { name: "Samosa", type: "Snacks", station: "General", isVeg: true, catImg: "Snack" },
  { name: "Roll", type: "Snacks", station: "Grill", isVeg: true, catImg: "Snack" },
  { name: "Wrap", type: "Snacks", station: "Grill", isVeg: true, catImg: "Snack" },
];

const modifiers = ["Classic", "Spicy", "Special", "Cheese", "Double", "Supreme", "Tandoori", "Premium", "Jumbo", "Mega"];
const proteins = ["Chicken", "Egg", "Mutton", "Paneer", "Mushroom", "Tofu", "Veg"];

const generateItems = (count, canteenId) => {
  const items = [];
  let nameSet = new Set();
  
  while(items.length < count) {
    let base = bases[Math.floor(Math.random() * bases.length)];
    let mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    let prot = proteins[Math.floor(Math.random() * proteins.length)];
    
    // Adjust isVeg based on protein
    let actualIsVeg = base.isVeg;
    if (["Chicken", "Egg", "Mutton"].includes(prot)) {
      actualIsVeg = false;
    }
    
    // Sometimes don't use protein
    let useProt = Math.random() > 0.5;
    let name = useProt ? `${mod} ${prot} ${base.name}` : `${mod} ${base.name}`;
    
    if (nameSet.has(name)) continue; // ensure uniqueness
    nameSet.add(name);
    
    let priceVariations = Math.floor(Math.random() * 10) * 10 + 40; // 40 to 130
    let price = priceVariations;
    if (!actualIsVeg) price += 30;
    if (mod === "Premium" || mod === "Supreme") price += 40;
    
    let imgArray = baseImages[base.catImg] || baseImages["Snack"];
    let img = imgArray[Math.floor(Math.random() * imgArray.length)];
    
    let tags = [base.catImg.toLowerCase().replace(' ', '-'), actualIsVeg ? 'veg' : 'non-veg', mod.toLowerCase()];
    if (Math.random() > 0.7) tags.push('popular');
    if (mod === "Spicy") tags.push('spicy');
    
    items.push({
      name: name,
      category: base.type,
      station: base.station,
      price: price,
      basePrice: price,
      image: img,
      description: `Delicious ${name} prepared with fresh ingredients. Perfect for a quick bite!`,
      availability: Math.random() > 0.1, // 90% available
      isVeg: actualIsVeg,
      preparationTime: Math.floor(Math.random() * 15) + 5,
      stockQuantity: Math.floor(Math.random() * 80) + 20,
      tags: tags,
      canteen: canteenId,
      avgRating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0
      ratingCount: Math.floor(Math.random() * 400) + 10
    });
  }
  return items;
};

const runSeed = async () => {
  try {
    await mongoose.connect('mongodb+srv://vsrr2006_db_user:vishnu123@openly.y3iowlc.mongodb.net/');
    console.log('MongoDB connected.');
    
    // Clear Existing
    await MenuItem.deleteMany({});
    await Canteen.deleteMany({}); // clearing to start fresh if needed, or we just create if not exists
    console.log('Cleared existing menu items and canteens.');

    // Create Canteen
    const mainCanteen = await Canteen.create({
      name: "Main Cafeteria",
      slug: "main-cafeteria",
      description: "The primary dining area serving a variety of multi-cuisine delicacies.",
      location: "Ground Floor, Central Block",
      isOpen: true,
      openTime: "08:00",
      closeTime: "22:00",
      rating: 4.5,
      numRatings: 1200,
      cuisine: ["Fast Food", "North Indian", "South Indian", "Chinese", "Beverages"],
      isPromoted: true
    });
    console.log(`Created Canteen: ${mainCanteen.name} with ID: ${mainCanteen._id}`);

    // Generate 100 items all belonging to this canteen
    const newItems = generateItems(100, mainCanteen._id);
    
    const result = await MenuItem.insertMany(newItems);
    console.log(`Successfully added ${result.length} unique items to the database associated with ${mainCanteen.name}`);
  } catch (error) {
    console.error('Error seeding items:');
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

runSeed();
