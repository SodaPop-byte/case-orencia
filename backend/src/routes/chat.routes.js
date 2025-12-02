import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { findOrCreateRoom, getMyChatRooms, getRoomHistory } from '../controllers/chat.controller.js';

const router = Router();
router.use(authenticateToken);
router.post('/room', findOrCreateRoom);
router.get('/rooms', getMyChatRooms);
router.get('/messages/:roomId', getRoomHistory);

export default router;