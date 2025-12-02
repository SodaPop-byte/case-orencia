import { Router } from 'express';
import { login, register, logout, refreshTokenHandler } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshTokenHandler);
router.post('/logout', logout);

export default router;