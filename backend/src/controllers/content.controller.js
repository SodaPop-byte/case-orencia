import Banner from '../models/banner.model.js';

export const getLandingContent = async (req, res) => {
    try {
        let banner = await Banner.findOne().sort({ createdAt: -1 });
        if (!banner) {
            // Default fallback
            banner = {
                heroImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2",
                title: "Premium Native Wear",
                subtitle: "Authentic Barongs and Sayas.",
                shippingFee: 150,
                bankDetails: "Bank: BDO - Account: 1234567890",
                qrCodeImage: ""
            };
        }
        res.status(200).json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLandingContent = async (req, res) => {
    try {
        // req.body contains text fields. 
        // req.file might contain 'hero' OR 'qr'. We need to handle which one was uploaded.
        // NOTE: Our simple middleware uploads one file to req.body.proofUrl. 
        // We will assume if an image is uploaded, we determine where it goes based on a flag or field name.
        
        // For simplicity, we will update text fields first
        const updateData = {
            title: req.body.title,
            subtitle: req.body.subtitle,
            shippingFee: req.body.shippingFee,
            bankDetails: req.body.bankDetails
        };

        // Check if an image was uploaded via the middleware (it puts URL in proofUrl)
        if (req.body.proofUrl) {
            if (req.body.imageType === 'qr') {
                updateData.qrCodeImage = req.body.proofUrl;
            } else {
                updateData.heroImage = req.body.proofUrl;
            }
        }

        const banner = await Banner.findOneAndUpdate({}, updateData, { new: true, upsert: true });

        res.status(200).json({ success: true, message: "Settings updated.", data: banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Update failed." });
    }
};