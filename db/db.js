import mongoose from "mongoose";

import { MONGO_URI, NODE_ENV } from "../config/env.js";


if (!MONGO_URI)
  throw new Error('Please define MONGO_URI in .env file!')

if (!NODE_ENV)
  throw new Error('Please define NODE_ENV in .env file!')


const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    console.log(`Successfully conected to db in ${NODE_ENV} mode!`);
  }
  catch (e) {
    console.error(`Error connecting to database: ${e.message}`)
    process.exit(1)
  }
}


export default connectDB;