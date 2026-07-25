import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  getTrainer,
  getTrainerAvailability,
  getTrainers,
} from './trainer.controller';

const trainerRouter = Router();

trainerRouter.get('/', getTrainers);
trainerRouter.get('/:trainerId', getTrainer);
trainerRouter.get(
  '/:trainerId/availability',
  authMiddleware,
  roleMiddleware(UserRole.Athlete),
  getTrainerAvailability,
);

export { trainerRouter };
