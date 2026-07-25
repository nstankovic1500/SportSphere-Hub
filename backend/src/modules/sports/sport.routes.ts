import { Router } from 'express';

import { getSports } from './sport.controller';

const sportRouter = Router();

sportRouter.get('/', getSports);

export { sportRouter };
