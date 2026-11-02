import 'dotenv/config';

export const ACCESS_TOKEN_EXPIRES_IN = 60 * 60; // 1h
export const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7d
export const DATABASE_URL = process.env.DATABASE_URL;
export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;
export const ACCESS_TOKEN_SECRET_KEY = process.env
  .ACCESS_TOKEN_SECRET_KEY as string;
export const REFRESH_TOKEN_SECRET_KEY = process.env
  .REFRESH_TOKEN_SECRET_KEY as string;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL as string;
export const FRONTEND_URL = process.env.FRONTEND_URL as string;
export const MAX_FILE_SIZE = 2 * 1024 * 1024;
export const RATE_LIMIT_TTL = 60 * 1000;
export const RATE_LIMIT_MAX = 100;
export const AUTH_RATE_LIMIT_MAX = 10;
