import { Router } from 'express';

import { getSportsController } from './sport.controller';

const sportRouter = Router();

sportRouter.get('/', getSportsController);

export { sportRouter };
