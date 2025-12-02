import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
    // Landing Page Stuff
    heroImage: { type: String, required: true },
    title: { type: String, required: true, default: "Premium Native Wear" },
    subtitle: { type: String, required: true, default: "Authentic Barongs and Sayas." },
    
    // NEW: Payment & Shipping Settings
    shippingFee: { type: Number, default: 150 },
    bankDetails: { type: String, default: "BDO: 001234567890 (Case Orencia)" },
    qrCodeImage: { type: String, default: "" } // URL from Cloudinary
}, { timestamps: true });

export default mongoose.model('Banner', BannerSchema);