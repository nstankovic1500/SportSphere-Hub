import { Router } from 'express';

import { adRouter, applyRequestRouter } from '../modules/ads/ad.routes';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../models/User';
import { adminRouter } from '../modules/admin/admin.routes';
import {
  addCartItem,
  checkoutOrders,
  deleteCartItem,
  updateCartItem,
} from '../modules/athletes/athlete.controller';
import { athleteRouter } from '../modules/athletes/athlete.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { employeeRouter } from '../modules/employees/employee.routes';
import { getProduct, getProducts } from '../modules/public/public.controller';
import { publicRouter } from '../modules/public/public.routes';
import { reviewRouter } from '../modules/reviews/review.routes';
import { sportRouter } from '../modules/sports/sport.routes';
import { trainerRouter } from '../modules/trainers/trainer.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
    data: {
      service: 'sportsphere-hub-backend',
    },
  });
});

router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/ads', adRouter);
router.use('/athletes', athleteRouter);
router.use('/employees', employeeRouter);
router.use('/facilities', reviewRouter);
router.use('/apply-requests', applyRequestRouter);
router.use('/public', publicRouter);
router.use('/sports', sportRouter);
router.use('/trainers', trainerRouter);
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.post('/cart/items', authMiddleware, roleMiddleware(UserRole.Athlete), addCartItem);
router.patch('/cart/items/:id', authMiddleware, roleMiddleware(UserRole.Athlete), updateCartItem);
router.delete('/cart/items/:id', authMiddleware, roleMiddleware(UserRole.Athlete), deleteCartItem);
router.post('/orders', authMiddleware, roleMiddleware(UserRole.Athlete), checkoutOrders);

export { router };
