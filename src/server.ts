// src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // must be first

import { validateEnv } from './config/env';
validateEnv(); // fail fast if any required env var is missing

import app from './app';
import { connectDB } from './db';

const PORT = process.env.PORT!;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});