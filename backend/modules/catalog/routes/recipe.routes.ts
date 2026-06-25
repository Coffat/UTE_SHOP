import { Router } from 'express';
import { createRecipe, updateRecipe, getRecipeByVariant, getAllRecipes } from '../controllers/recipe.controller.js';
import { authenticate, authorize } from '../../../shared/middlewares/authenticate.js';

const router = Router();

// Only ADMIN or STORE_STAFF / WAREHOUSE_STAFF depending on your business rules.
// Let's allow ADMIN for now, maybe WAREHOUSE_STAFF can view.
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE_STAFF'), createRecipe);
router.put('/:id', authenticate, authorize('ADMIN', 'WAREHOUSE_STAFF'), updateRecipe);
router.get('/variant/:variantId', authenticate, getRecipeByVariant);
router.get('/', authenticate, getAllRecipes);

export default router;
