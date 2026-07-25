import { Router } from 'express';

import { adRouter, applyRequestRouter } from '../modules/ads/ad.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import { athleteRouter } from '../modules/athletes/athlete.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { employeeRouter } from '../modules/employees/employee.routes';
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

export { router };
