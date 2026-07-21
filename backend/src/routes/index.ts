import { Router } from 'express';

import { adminRouter } from '../modules/admin/admin.routes';
import { athleteRouter } from '../modules/athletes/athlete.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { publicRouter } from '../modules/public/public.routes';
import { sportRouter } from '../modules/sports/sport.routes';

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
router.use('/athletes', athleteRouter);
router.use('/public', publicRouter);
router.use('/sports', sportRouter);

export { router };
