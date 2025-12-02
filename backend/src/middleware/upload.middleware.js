// upload.middleware.js (ESM)
import multer from 'multer';
import DatauriParser from 'datauri/parser.js';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import { z } from 'zod';

// ----------------------------------------------------
// A. Multer Setup (Handles file receipt)
// ----------------------------------------------------

// Use memory storage so we can access the buffer for Cloudinary
const storage = multer.memoryStorage(); 

// Multer upload function
export const multerUpload = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        // Accept only JPEG, PNG, or GIF
        if (file.mimetype.startsWith('image')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) are allowed.'), false);
        }
    }
});


// ----------------------------------------------------
// B. Cloudinary Processing Middleware
// ----------------------------------------------------

// Datauri parser converts buffer to data URI string
const parser = new DatauriParser();

// Custom middleware to send single image to Cloudinary
export const uploadSingleImage = async (req, res, next) => {
    if (!req.file) {
        // If no file, continue (e.g., updating a product without new image)
        // Or throw error if required (depends on context)
        return next(); 
    }
    
    try {
        // Convert buffer to data URI string for Cloudinary
        const fileExtension = path.extname(req.file.originalname).toString();
        const dataUri = parser.format(fileExtension, req.file.buffer);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri.content, {
            folder: `case-orencia/proofs`, // Folder for payment proofs
        });
        
        // Attach the image URL to the request body
        req.body.proofUrl = result.secure_url; 
        
        next();
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Image upload failed. Please try again.' 
        });
    }
};

// Custom middleware to upload multiple product images
export const uploadMultipleImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        // Allow continuation, but validation in controller will check min images
        return next(); 
    }

    try {
        const uploadPromises = req.files.map(file => {
            const fileExtension = path.extname(file.originalname).toString();
            const dataUri = parser.format(fileExtension, file.buffer);
            return cloudinary.uploader.upload(dataUri.content, {
                folder: `case-orencia/products`, // Dedicated folder for products
            });
        });

        const results = await Promise.all(uploadPromises);
        
        // Attach the array of secure URLs to the request body
        req.body.images = results.map(result => result.secure_url);
        
        next();
    } catch (error) {
        console.error('Cloudinary Multi-Upload Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Multiple image upload failed. Please check file format/size.' 
        });
    }
};