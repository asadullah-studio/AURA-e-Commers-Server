import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductsByCategory,
} from '../controllers/productController.js';

const router = Router();

router.get('/', getProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

export default router;
