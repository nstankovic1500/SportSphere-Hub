import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import {
  adminLoginController,
  currentUserController,
  loginController,
  registerController,
} from './auth.controller';

const authRouter = Router();

authRouter.post('/adminLogin', adminLoginController);
authRouter.post('/login', loginController);
authRouter.post('/register', registerController);
authRouter.get('/current', authMiddleware, currentUserController);

export { authRouter };
