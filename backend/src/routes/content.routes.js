import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { multerUpload, uploadSingleImage } from '../middleware/upload.middleware.js';
import { getLandingContent, updateLandingContent } from '../controllers/content.controller.js';

const router = Router();

// Public Route: Get Data
router.get('/landing', getLandingContent);

// Admin Route: Update Data (Uploads 'hero' image)
router.put('/landing', 
    authenticateToken, 
    requireRole(['admin']), 
    multerUpload.single('hero'), // Expects form field name 'hero'
    uploadSingleImage,           // Uploads to Cloudinary
    updateLandingContent
);

export default router;