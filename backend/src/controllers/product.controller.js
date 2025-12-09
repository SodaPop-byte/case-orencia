import * as productService from '../services/product.service.js';
import { ProductSchema } from '../utils/product.validation.js';
import { z } from 'zod';

const parseFormData = (req) => {
    const body = req.body;
    
    // 1. Get Images (Try req.body.images first, fallback to [] if missing)
    let rawImages = body.images || [];

    // Safety: If it's a single item, array-ify it
    if (!Array.isArray(rawImages)) rawImages = [rawImages];

    // Safety: Flatten and extract strings
    const cleanImages = rawImages
        .flat(Infinity) 
        .map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) return item.secure_url || item.url;
            return null;
        })
        .filter(url => typeof url === 'string' && url.length > 5);

    const cleaned = {
        ...body,
        basePrice: body.basePrice ? parseFloat(body.basePrice) : 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : 0,
        stockQuantity: body.stockQuantity ? parseInt(body.stockQuantity, 10) : 0,
        isPublished: body.isPublished === 'true' || body.isPublished === true,
        // DO NOT assign images here yet. We do it conditionally below.
    };

    // --- CRITICAL FIX FOR EDITING ---
    // If we have images, add them.
    // If we DON'T have images, leave the key 'undefined'.
    // Sending images: [] will crash Zod validation because of min(1).
    if (cleanImages.length > 0) {
        cleaned.images = cleanImages;
    }

    return cleaned;
};

export const createProduct = async (req, res) => {
    try {
        const rawData = parseFormData(req);
        
        // Manual Check for Create only: Ensure images exist
        // (Since we removed the default [], Zod will say "Required" if missing, which is good for Create)
        if (!rawData.images || rawData.images.length === 0) {
             // Fallback: If parseFormData didn't find images, try the body directly just in case
             // This prevents "Required" error if the middleware worked but parseFormData logic was too strict
             if(req.body.images && req.body.images.length > 0) {
                 rawData.images = req.body.images;
             }
        }

        const productData = ProductSchema.parse(rawData);
        const userId = req.user ? req.user.id : null; 
        const newProduct = await productService.createProduct(productData, userId);
        
        res.status(201).json({ success: true, message: 'Product created successfully.', data: newProduct });
    } catch (error) {
        console.error("Create Product Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation failed', details: error.errors });
        }
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'SKU must be unique.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const rawData = parseFormData(req);
        
        // Zod Partial Logic:
        // If rawData.images is UNDEFINED -> Zod ignores it (Update succeeds, old images kept).
        // If rawData.images is [] -> Zod checks min(1) and FAILS.
        
        const productData = ProductSchema.partial().parse(rawData);
        
        const updatedProduct = await productService.updateProduct(req.params.id, productData, req.user?.id);
        res.status(200).json({ success: true, message: 'Product updated successfully.', data: updatedProduct });
    } catch (error) {
        console.error("Update Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation failed', details: error.errors });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// ... Keep getProducts, getProductById, deleteProduct as they were ...
export const getProducts = async (req, res) => {
    try {
        const filters = req.query;
        if (req.user?.role === 'reseller') filters.isPublished = 'true';
        const result = await productService.getProducts(filters, req.query);
        res.status(200).json({ success: true, data: result.products, meta: result.meta });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.status(200).json({ success: true, data: product });
    } catch (e) { res.status(404).json({ message: e.message }); }
};

export const deleteProduct = async (req, res) => {
    try {
        await productService.deleteProduct(req.params.id);
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (e) { res.status(404).json({ message: e.message }); }
};