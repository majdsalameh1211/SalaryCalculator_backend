import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import shiftsRouter from './routes/shifts';
import settingsRouter from './routes/settings';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    /\.railway\.app$/  // allows any railway subdomain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Protected routes
app.use('/api/shifts', authMiddleware, shiftsRouter);
app.use('/api/settings', authMiddleware, settingsRouter);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
