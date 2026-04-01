const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Transformation settings for optimized delivery
const defaultTransformations = [
    { width: 500, height: 500, crop: "fill", gravity: "auto" },
    { fetch_format: "auto", quality: "auto" }
];

const menuStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "canteen_menu",
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: defaultTransformations,
    },
});

const communityStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "community_posts",
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: defaultTransformations,
    },
});

module.exports = { cloudinary, menuStorage, communityStorage };
