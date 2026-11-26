import { z } from 'zod';
import { Defaults } from '@nagrik-setu/shared';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url().default(Defaults.API_BASE_URL),
  CLIENT_ORIGIN: z.string().default(Defaults.CLIENT_ORIGIN),

  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().default(Defaults.REDIS_URL),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  SESSION_VERIFY_SECRET: z.string().min(16),
  SSE_TICKET_SECRET: z.string().min(16),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default(Defaults.STORAGE_PATH),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  AI_PROVIDER: z.enum(['mock', 'gemini', 'claude', 'openai']).default('mock'),
  AI_API_KEY: z.string().optional(),
  EMBEDDING_PROVIDER: z.enum(['mock', 'clip', 'remote', 'caption']).default('mock'),

RUN_WORKER: z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((value) => value === 'true' || value === '1'),

  DUP_RADIUS_M: z.coerce.number().default(Defaults.DUP_RADIUS_M),
  DUP_WINDOW_DAYS: z.coerce.number().default(Defaults.DUP_WINDOW_DAYS),
  DUP_HIGH: z.coerce.number().default(Defaults.DUP_HIGH),
  DUP_GREY: z.coerce.number().default(Defaults.DUP_GREY),

  TRUST_PASS: z.coerce.number().default(Defaults.TRUST_PASS),
  TRUST_REVIEW: z.coerce.number().default(Defaults.TRUST_REVIEW),
  RESOLVE_RADIUS_M: z.coerce.number().default(Defaults.RESOLVE_RADIUS_M),

  SENTRY_DSN: z.string().optional(),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  _config = result.data;
  return _config;
}

export function getConfig(): Config {
  if (!_config) throw new Error('Config not loaded. Call loadConfig() at startup.');
  return _config;
}
