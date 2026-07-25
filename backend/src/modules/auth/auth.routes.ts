import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import {
  adminLogin,
  currentUser,
  login,
  register,
} from './auth.controller';

const authRouter = Router();

authRouter.post('/adminLogin', adminLogin);
authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.get('/current', authMiddleware, currentUser);

export { authRouter };
