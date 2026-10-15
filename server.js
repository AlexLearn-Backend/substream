import express from 'express';

import connectDB from './db/db.js';

import { PORT } from './config/env.js';


const App = express();


App.get('/', (req, res) => res.send('Hello World!'));


App.listen(PORT || 5000, async () => {
  connectDB()
  console.log(`API running at http://localhost:${PORT || 5000}`);
});