// inventory.service.js (ESM) - COMPLETE LOGIC
import Inventory from '../models/inventory.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';

// Initialize defaults
export const initializeInventory = async () => {
    const itemNames = ['saya', 'barong', 'fabrics'];
    for (const name of itemNames) {
        await Inventory.findOneAndUpdate(
            { itemName: name }, 
            { $setOnInsert: { itemName: name, stockLevel: 0 } }, 
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
};

// Internal Helper
const updateStockAndLog = async (itemName, quantity, logEntry, session) => {
    const inventory = await Inventory.findOneAndUpdate(
        { itemName: itemName },
        { 
            $inc: { stockLevel: quantity }, 
            $push: { log: logEntry },
            $setOnInsert: { itemName: itemName }
        },
        { new: true, runValidators: true, session, upsert: true }
    );

    if (inventory.stockLevel < 0) {
        throw new Error(`Inventory stock for ${itemName} cannot go below zero.`);
    }
    return inventory;
};

// 1. DEDUCT STOCK (Used when Order -> PROCESSING)
export const deductStock = async (orderItems, orderId, adminId) => {
    try {
        const productIds = orderItems.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const deductions = {}; 

        for (const item of orderItems) {
            const product = products.find(p => p._id.equals(item.productId));
            if (product) {
                // Deduct from Product Level
                product.stockQuantity -= item.quantity;
                await product.save();

                // Group by Inventory Type
                const type = product.inventoryType;
                deductions[type] = (deductions[type] || 0) + item.quantity;
            }
        }

        // Deduct from Global Inventory Level
        for (const [itemName, quantity] of Object.entries(deductions)) {
            const logEntry = {
                actionType: 'DEDUCTION', 
                quantityChange: -quantity, 
                referenceId: orderId, 
                updatedBy: adminId, 
                reason: `Order processing.`
            };
            // Pass negative quantity to subtract
            await updateStockAndLog(itemName, -quantity, logEntry); 
        }
        return true;
    } catch (error) {
        console.error("Deduct Stock Error:", error);
        throw new Error(`Inventory deduction failed: ${error.message}`);
    }
};

// 2. RESTORE STOCK (Used when Order -> CANCELLED, *if* it was Processing)
export const restoreStock = async (orderItems, orderId, adminId) => {
    try {
        const productIds = orderItems.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const restorations = {}; 

        for (const item of orderItems) {
            const product = products.find(p => p._id.equals(item.productId));
            if (product) {
                // ADD BACK to Product Level
                product.stockQuantity += item.quantity;
                await product.save();

                // Group by Inventory Type
                const type = product.inventoryType;
                restorations[type] = (restorations[type] || 0) + item.quantity;
            }
        }

        // ADD BACK to Global Inventory Level
        for (const [itemName, quantity] of Object.entries(restorations)) {
            const logEntry = {
                actionType: 'RESTORATION', 
                quantityChange: quantity, // Positive number
                referenceId: orderId, 
                updatedBy: adminId, 
                reason: `Order cancelled (Restock).`
            };
            
            // Pass positive quantity to add
            await updateStockAndLog(itemName, quantity, logEntry);
        }
        return true;
    } catch (error) {
        console.error("Restore Stock Error:", error);
        throw new Error(`Inventory restoration failed: ${error.message}`);
    }
};

// 3. MANUAL ADJUSTMENT (Dashboard Button)
export const manualStockAdjustment = async (itemName, quantity, reason, adminId) => {
    try {
        const actionType = quantity > 0 ? 'MANUAL_IN' : 'MANUAL_OUT';
        const logEntry = {
            actionType,
            quantityChange: quantity,
            updatedBy: adminId,
            reason
        };
        return await updateStockAndLog(itemName, quantity, logEntry);
    } catch (error) {
        throw error;
    }
};

export const getInventoryDetails = async () => Inventory.find({});
export const getLowStockAlerts = async (threshold = 10) => Inventory.find({ stockLevel: { $lte: threshold } });