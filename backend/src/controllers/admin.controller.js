// admin.controller.js (ESM) - FINAL PRODUCTION CLEAN
import * as orderService from '../services/order.service.js';
import * as reportService from '../services/report.service.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js'; 
import { z } from 'zod';

const STATUS_OPTIONS = [
    'AWAITING PAYMENT', 'PENDING VERIFICATION', 'PROCESSING', 
    'SHIPPED', 'DELIVERED', 'CANCELLED'
];

const UpdateStatusSchema = z.object({
    status: z.enum(STATUS_OPTIONS),
    trackingNumber: z.string().optional() 
}).refine(data => {
    if (data.status === 'SHIPPED' && !data.trackingNumber) {
        return false;
    }
    return true;
}, {
    message: "Tracking number is required when moving status to SHIPPED.",
    path: ['trackingNumber'],
});

// 1. Get All Orders
export const getAllOrders = async (req, res) => {
    try {
        const { status: statusFilter } = req.query;
        const query = statusFilter ? { status: statusFilter.toUpperCase() } : {};
        
        const orders = await Order.find(query)
            .populate('resellerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching orders.' });
    }
};

// 2. Update Order Status
export const updateOrderStatusController = async (req, res) => {
    try {
        const adminId = req.user.id;
        const validatedData = UpdateStatusSchema.parse(req.body);
        
        const updatedOrder = await orderService.updateOrderStatus(req.params.id, validatedData.status, adminId, validatedData.trackingNumber);

        res.status(200).json({
            success: true,
            message: `Order status updated to ${validatedData.status}.`,
            data: updatedOrder
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation failed.', details: error.errors });
        }
        res.status(400).json({ success: false, message: error.message || 'Order update failed.' });
    }
};

// 3. Sales Report
export const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) throw new Error("Start and End dates required.");
        const report = await reportService.generateSalesReport(startDate, endDate, req.user.id);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Invalid date format.' });
        res.status(400).json({ success: false, message: error.message || 'Error generating sales report.' });
    }
};

// 4. Inventory Report
export const getInventoryReport = async (req, res) => {
    try {
        const report = await reportService.generateInventoryReport();
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error generating inventory report.' });
    }
};

// 5. User Details
export const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, 'name email role').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};