import { config } from 'dotenv';

config({
  path: [`.env.${process.env.NODE_ENV || 'development'}.local`]
});


export const {
  PORT,
  MONGO_URI,
  JWT_SECRET, JWT_EXPIRES_IN,
  ARCJET_KEY,
  QSTASH_TOKEN, QSTASH_URL,
  EMAIL_PASSWORD,
  ARCJET_ENV, NODE_ENV
} = process.env;