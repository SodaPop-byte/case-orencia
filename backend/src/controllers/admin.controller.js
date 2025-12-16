// backend/controllers/admin.controller.js (FINAL COMPLETE VERSION)
import * as orderService from '../services/order.service.js';
import * as reportService from '../services/report.service.js';
import * as authService from '../services/auth.service.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js'; 
import Notification from '../models/notification.model.js'; // ⬅️ Critical Import
import { z } from 'zod';

// --- VALIDATION SCHEMAS ---
const STATUS_OPTIONS = [
    'AWAITING PAYMENT', 'PENDING VERIFICATION', 'PROCESSING', 
    'SHIPPED', 'DELIVERED', 'CANCELLED'
];

const UpdateStatusSchema = z.object({
    status: z.enum(STATUS_OPTIONS),
    trackingNumber: z.string().optional() 
}).refine(data => {
    if (data.status === 'SHIPPED' && !data.trackingNumber) return false;
    return true;
}, {
    message: "Tracking number is required when moving status to SHIPPED.",
    path: ['trackingNumber'],
});

const AdminCreateUserSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'reseller', 'staff']),
});

// --- CONTROLLER FUNCTIONS ---

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
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Update Order Status (WITH REAL-TIME BROADCAST)
export const updateOrderStatusController = async (req, res) => {
    try {
        const adminId = req.user.id;
        const validatedData = UpdateStatusSchema.parse(req.body);
        
        // A. Perform the Update
        const updatedOrder = await orderService.updateOrderStatus(
            req.params.id, 
            validatedData.status, 
            adminId, 
            validatedData.trackingNumber
        );

        // B. 🛑 NOTIFY RESELLER VIA SOCKET 🛑
        const io = req.app.get('io');
        if (io) {
            // Emit to everyone (Frontend filters by user ID)
            io.emit('order_update', updatedOrder);
            console.log(`📢 Status Update Broadcasted: Order #${updatedOrder._id} -> ${validatedData.status}`);
        }

        res.status(200).json({ success: true, message: `Updated to ${validatedData.status}`, data: updatedOrder });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', details: error.errors });
        res.status(400).json({ success: false, message: error.message });
    }
};

// 3. Admin Create User
export const createAdminUserController = async (req, res) => {
    try {
        const validatedData = AdminCreateUserSchema.parse(req.body);
        const newUser = await authService.registerUser(validatedData); 
        res.status(201).json({ success: true, message: `User created`, data: newUser });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: 'Email already exists.' });
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Sales Report
export const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) throw new Error("Dates required");
        const report = await reportService.generateSalesReport(startDate, endDate, req.user.id);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 5. Inventory Report
export const getInventoryReport = async (req, res) => {
    try {
        const report = await reportService.generateInventoryReport();
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. User Details
export const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, 'name email role').lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- NOTIFICATION CONTROLLERS ---

// 7. Get Notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientRole: 'admin' })
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Mark ALL Notifications Read
export const markNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientRole: 'admin', isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};