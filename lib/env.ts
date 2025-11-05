import { z } from 'zod'

/**
 * Environment variable validation schema
 * This ensures all required environment variables are set at application startup
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters long'),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Optional: Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Optional: File Upload
  MAX_FILE_SIZE: z.string().optional(),
  UPLOAD_DIR: z.string().optional(),

  // Optional: Redis
  REDIS_URL: z.string().url().optional(),

  // Optional: Error Tracking
  SENTRY_DSN: z.string().url().optional(),

  // Optional: Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Optional: Telegram Bot
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // Optional: OpenAI
  OPENAI_API_KEY: z.string().optional(),
})

/**
 * Validated environment variables
 * Use this instead of process.env to ensure type safety and validation
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables at application startup
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err: { path: (string | number)[]; message: string }) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env file.`
      )
    }
    throw error
  }
}

/**
 * Validated and typed environment variables
 * Import this instead of using process.env directly
 */
export const env = validateEnv()

/**
 * Check if we're in production
 */
export const isProd = env.NODE_ENV === 'production'

/**
 * Check if we're in development
 */
export const isDev = env.NODE_ENV === 'development'

/**
 * Check if we're in test
 */
export const isTest = env.NODE_ENV === 'test'
