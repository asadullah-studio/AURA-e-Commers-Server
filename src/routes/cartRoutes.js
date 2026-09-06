import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All cart routes require active session
router.use(requireAuth);

router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:id', updateCartItem);
router.delete('/:id', removeCartItem);
router.delete('/', clearCart);

export default router;
