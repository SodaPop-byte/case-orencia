// src/middleware/upload.middleware.js
import multer from 'multer';
import DatauriParser from 'datauri/parser.js';
import path from 'path';
import cloudinary from '../config/cloudinary.js';

const storage = multer.memoryStorage(); 

export const multerUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) cb(null, true);
        else cb(new Error('Only images allowed'), false);
    }
});

const parser = new DatauriParser();

export const uploadSingleImage = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const ext = path.extname(req.file.originalname).toString();
        const file64 = parser.format(ext, req.file.buffer);
        const result = await cloudinary.uploader.upload(file64.content, { folder: 'case-orencia/proofs' });
        
        req.body.proofUrl = result.secure_url; // ✅ SAVES STRING
        next();
    } catch (error) {
        res.status(500).json({ message: 'Upload failed' });
    }
};

export const uploadMultipleImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    try {
        const uploadPromises = req.files.map(file => {
            const ext = path.extname(file.originalname).toString();
            const file64 = parser.format(ext, file.buffer);
            return cloudinary.uploader.upload(file64.content, { folder: 'case-orencia/products' });
        });

        const results = await Promise.all(uploadPromises);
        
        // 🛑 THIS IS THE FIX 🛑
        // We map the objects to simple strings.
        // Before: [{ secure_url: '...', ... }] -> BAD
        // After:  ['https://...', 'https://...'] -> GOOD
        const newLinks = results.map(r => r.secure_url);

        // If existing images exist (from Frontend), merge them.
        // If req.body.images is "string", make it array.
        let existingImages = req.body.images || [];
        if (!Array.isArray(existingImages)) existingImages = [existingImages];

        // Combine old images + new uploads
        req.body.images = [...existingImages, ...newLinks];

        console.log("✅ CLEAN IMAGES:", req.body.images); 
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Upload failed' });
    }
};