import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  MONGO_URI: process.env.MONGO_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
  DB_NAME: 'sportsphere_hub',
} as const;

export { env };
