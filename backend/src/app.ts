import cors from 'cors';
import express from 'express';

import { UPLOAD_ROOT } from './config/upload';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { router } from './routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_ROOT));

app.use('/api', router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
