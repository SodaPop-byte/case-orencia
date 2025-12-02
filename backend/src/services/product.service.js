// product.service.js (ESM) - SYNCED WITH INVENTORY
import Product from '../models/product.model.js';
import { manualStockAdjustment } from './inventory.service.js'; // Import Inventory Logic

export const createProduct = async (productData, adminId) => {
    const product = new Product(productData);
    await product.save();

    // --- SYNC: If initial stock is > 0, update Global Inventory ---
    if (product.stockQuantity > 0) {
        try {
            await manualStockAdjustment(
                product.inventoryType, // e.g., 'barong'
                product.stockQuantity, // e.g., 10
                `New Product Listing: ${product.name} (${product.SKU})`,
                adminId
            );
        } catch (err) {
            console.error("Warning: Inventory sync failed for createProduct", err);
            // We don't throw here to avoid failing the product creation, but you could.
        }
    }

    return product;
};

export const updateProduct = async (id, updateData, adminId) => {
    // 1. Get the OLD product first to compare stock
    const oldProduct = await Product.findById(id);
    if (!oldProduct) throw new Error('Product not found.');

    const oldStock = oldProduct.stockQuantity;
    
    // 2. Perform the update
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    // 3. --- SYNC: Calculate difference and update Global Inventory ---
    // Only if stockQuantity was actually included in the update
    if (updateData.stockQuantity !== undefined) {
        const newStock = updateData.stockQuantity;
        const difference = newStock - oldStock;

        if (difference !== 0) {
            try {
                await manualStockAdjustment(
                    updatedProduct.inventoryType,
                    difference, // Can be positive (add) or negative (deduct)
                    `Stock adjustment on Product: ${updatedProduct.name}`,
                    adminId
                );
            } catch (err) {
                console.error("Warning: Inventory sync failed for updateProduct", err);
            }
        }
    }

    return updatedProduct;
};

export const deleteProduct = async (id) => {
    const product = await Product.findByIdAndUpdate(id, { deletedAt: new Date(), isPublished: false }, { new: true });
    if (!product) throw new Error('Product not found.');
    return { id, message: 'Product soft-deleted.' };
};

export const getProducts = async (filters, options) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const query = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.inventoryType) query.inventoryType = filters.inventoryType;
    if (filters.published === 'true') query.isPublished = true;
    if (filters.search) query.$text = { $search: filters.search };

    const products = await Product.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();

    const totalResults = await Product.countDocuments(query);

    return { products, meta: { totalResults, totalPages: Math.ceil(totalResults / limit), currentPage: page } };
};

export const getProductById = async (id) => {
    const product = await Product.findById(id);
    if (!product) throw new Error('Product not found.');
    return product;
};