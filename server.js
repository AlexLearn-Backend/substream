import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import connectDB from './db/db.js';

import { PORT } from './config/env.js';


const App = express();


App.use(express.json());
App.use(cookieParser());
App.use(express.urlencoded({ extended: false }));
App.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: true
}));


App.get('/', (req, res) => res.send('Welcome to Substream API.'));


App.listen(PORT || 5000, async () => {
  await connectDB()
  console.log(`API running at http://localhost:${PORT || 5000}`);
});