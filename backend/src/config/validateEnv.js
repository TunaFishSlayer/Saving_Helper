import logger from "../utils/logger.js";

export const validateEnv = () => {
  const required = [
    'DATABASE_URL',

    'JWT_SECRET',
    'PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'SMTP_HOST'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  logger.info('Environment variables validated successfully');
};