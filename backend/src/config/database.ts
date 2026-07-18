import mongoose from 'mongoose';

import { env } from './env';

const connectDatabase = async () => {
  await mongoose.connect(env.MONGO_URI);

  console.log(`Connected to MongoDB database: ${env.DB_NAME}`);
};

export { connectDatabase };
