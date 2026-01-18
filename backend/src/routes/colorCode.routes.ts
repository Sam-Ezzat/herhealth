import express from 'express';
import * as colorCodeController from '../controllers/colorCode.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, colorCodeController.getAllColorCodes);
router.get('/:id', authenticate, colorCodeController.getColorCodeById);
router.post('/', authenticate, colorCodeController.createColorCode);
router.put('/:id', authenticate, colorCodeController.updateColorCode);
router.delete('/:id', authenticate, colorCodeController.deleteColorCode);

export default router;
