// product.controller.js (ESM) - FINAL CLEANED VERSION
import * as productService from '../services/product.service.js';
import { ProductSchema } from '../utils/product.validation.js';
import { z } from 'zod';

const createProductController = async (req, res) => {
    try {
        const productData = ProductSchema.parse(req.body);
        if (req.body.images) productData.images = req.body.images;
        const newProduct = await productService.createProduct(productData, req.user.id);
        res.status(201).json({ success: true, message: 'Product created & Stock synced.', data: newProduct });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', details: error.errors });
        if (error.code === 11000) return res.status(400).json({ success: false, message: 'SKU must be unique.' });
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProductsController = async (req, res) => {
    try {
        const { page, limit, sortBy, sortOrder, ...filters } = req.query;
        if (req.user && req.user.role === 'reseller') filters.published = 'true';
        const result = await productService.getProducts(filters, { page, limit, sortBy, sortOrder });
        res.status(200).json({ success: true, data: result.products, meta: result.meta });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProductByIdController = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

const updateProductController = async (req, res) => {
    try {
        const productData = ProductSchema.partial().parse(req.body);
        const updatedProduct = await productService.updateProduct(req.params.id, productData, req.user.id);
        res.status(200).json({ success: true, message: 'Product & Stock updated.', data: updatedProduct });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteProductController = async (req, res) => {
    try {
        await productService.deleteProduct(req.params.id);
        res.status(200).json({ success: true, message: 'Product deleted.' });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// --- FINAL EXPORT BLOCK (Define exports ONCE) ---
export {
    createProductController, 
    getProductsController, 
    updateProductController, 
    deleteProductController,
    getProductByIdController
};