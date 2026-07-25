import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedAthleteRequest, TrainerListQuery } from './trainer.types';
import {
  getTrainer as getTrainerService,
  getTrainerAvailability as getTrainerAvailabilityService,
  getTrainers as getTrainersService,
} from './trainer.service';

const getTrainers = asyncHandler(async (req: Request, res: Response) => {
  const data = await getTrainersService(req.query as TrainerListQuery);

  res.status(200).json({
    success: true,
    data,
  });
});

const getTrainer = asyncHandler(async (req: Request, res: Response) => {
  const trainerId = String(req.params.trainerId);
  const data = await getTrainerService(trainerId);

  res.status(200).json({
    success: true,
    data,
  });
});

const getTrainerAvailability = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const trainerId = String(req.params.trainerId);
  const date = String(req.query.date ?? '');
  const data = await getTrainerAvailabilityService(trainerId, date);

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  getTrainer,
  getTrainerAvailability,
  getTrainers,
};
