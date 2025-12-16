// src/routes/admin.routes.js (FINAL FIXED VERSION)
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { multerUpload, uploadMultipleImages } from '../middleware/upload.middleware.js';

// Import Controller Functions
import { 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getProducts,
    getProductById
} from '../controllers/product.controller.js'; 

import { 
    getAllOrders, 
    updateOrderStatusController, 
    getSalesReport, 
    getInventoryReport, 
    getUserDetails,
    createAdminUserController,
    // 🛑 IMPORT THE NEW FUNCTIONS
    getNotifications,
    markNotificationsRead // ⬅️ Plural (Matches Controller)
} from '../controllers/admin.controller.js'; 

import { 
    getInventory, 
    adjustStock, 
    getLowStock 
} from '../controllers/inventory.controller.js';

const router = Router();

// Apply security globally
router.use(authenticateToken);
router.use(requireRole(['admin']));

// --- PRODUCT ROUTES ---
router.post('/products', 
    multerUpload.array('images', 5), 
    uploadMultipleImages, 
    createProduct
);
router.get('/products', getProducts); 
router.get('/products/:id', getProductById);
router.put('/products/:id', multerUpload.array('images', 5), uploadMultipleImages, updateProduct); 
router.delete('/products/:id', deleteProduct);

// --- INVENTORY & ORDERS ---
router.get('/inventory', getInventory);
router.patch('/inventory/adjust', adjustStock);
router.get('/inventory/low-stock', getLowStock);

router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatusController);

// --- REPORTS & USERS ---
router.get('/reports/sales', getSalesReport); 
router.get('/reports/inventory', getInventoryReport); 
router.post('/users', createAdminUserController); 
router.get('/users/:id', getUserDetails); 

// --- 🛑 NOTIFICATIONS (FIXED) 🛑 ---
router.get('/notifications', getNotifications);

// ⚡ THIS FIXES THE STACKING:
// It matches the Frontend call: api.put('/admin/notifications/mark-read')
router.put('/notifications/mark-read', markNotificationsRead); 

export default router;