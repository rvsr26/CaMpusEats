const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");
require("dotenv").config();

async function checkImages() {
    await mongoose.connect(process.env.MONGO_URI);
    const items = await MenuItem.find({});
    const relative = items.filter(i => i.image && !i.image.startsWith("http"));
    console.log("Total items:", items.length);
    console.log("Relative image items:", relative.length);
    if (relative.length > 0) {
        console.log("First 5 relative:", relative.slice(0, 5).map(i => ({ name: i.name, image: i.image })));
    }
    mongoose.disconnect();
}

checkImages();
