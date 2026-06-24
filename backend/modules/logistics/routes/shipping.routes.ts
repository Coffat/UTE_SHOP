import { Router } from 'express';
import { ShippingController } from '../controllers/shipping.controller.js';

const router = Router();

// Endpoint public or protected depending on business rule (usually public for checkout calculation)
router.post('/calculate-fee', ShippingController.calculateFee);

export default router;
