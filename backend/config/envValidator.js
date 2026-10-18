// backend/config/envValidator.js
const { z } = require('zod');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_MAX_POOL_SIZE: z.coerce.number().int().min(1).max(100).optional(),
  JWT_SECRET: z.string().refine((val) => {
    if (process.env.NODE_ENV === 'production') return val.length >= 32;
    return val.length >= 8;
  }, { message: 'JWT_SECRET must be at least 32 characters in production (8 in dev/test)' }),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
  ENCRYPTION_KEY: z.string().refine((val) => {
    try {
      const buf = Buffer.from(val, 'base64');
      return buf.length === 32;
    } catch {
      return false;
    }
  }, { message: 'ENCRYPTION_KEY must be a valid 32-byte base64-encoded string for AES-256' }),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().optional(),
});

const validateEnv = (customEnv = process.env) => {
  const result = envSchema.safeParse(customEnv);
  if (!result.success) {
    console.error('FATAL: Environment validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - [${issue.path.join('.')}]: ${issue.message}`);
    });
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw new Error('Environment validation failed');
  }
  return result.data;
};

module.exports = { validateEnv, envSchema };
