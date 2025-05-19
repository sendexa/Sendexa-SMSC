import { Router } from 'express';
import messageRoutes from './routes/messages';

const router = Router();

// Register message routes
router.use('/messages', messageRoutes);

export default router; 