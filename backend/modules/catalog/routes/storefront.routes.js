import express from 'express';
import * as storefrontController from '../controllers/storefront.controller.js';

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/home', storefrontController.getHomeProducts);

export default router;
