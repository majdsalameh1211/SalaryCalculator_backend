// src/config/env.ts
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'PORT'
] as const;

export const validateEnv = (): void => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your .env file.');
    process.exit(1);
  }

  // Warn if JWT_SECRET is too short
  if (process.env.JWT_SECRET!.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};