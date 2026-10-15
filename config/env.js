import { config } from 'dotenv';

config({
  path: [`.env.${process.env.NODE_ENV || 'development'}.local`]
});


export const {
  PORT,
  MONGO_URI,
  ARCJET_KEY,
  NODE_ENV
} = process.env;