import { Router } from 'express';

import { adminRouter } from '../modules/admin/admin.routes';
import { authRouter } from '../modules/auth/auth.routes';

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

export { router };
