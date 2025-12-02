import * as inventoryService from '../services/inventory.service.js';
import { z } from 'zod';

const AdjustmentSchema = z.object({
    itemName: z.enum(['saya', 'barong', 'fabrics']),
    quantity: z.number().int().refine(n => n !== 0, { message: "Quantity cannot be zero" }),
    
    // 👇 CHANGE THIS LINE
    reason: z.string().min(1, "Reason is required")
});

export const getInventory = async (req, res) => {
    try {
        const inventory = await inventoryService.getInventoryDetails();
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adjustStock = async (req, res) => {
    try {
        const { itemName, quantity, reason } = AdjustmentSchema.parse(req.body);
        const updated = await inventoryService.manualStockAdjustment(itemName, quantity, reason, req.user.id);
        res.status(200).json({ success: true, message: 'Stock adjusted.', data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getLowStock = async (req, res) => {
    try {
        const alerts = await inventoryService.getLowStockAlerts();
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};