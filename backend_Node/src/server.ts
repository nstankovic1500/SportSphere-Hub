import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

const startServer = async () => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
};

startServer().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
