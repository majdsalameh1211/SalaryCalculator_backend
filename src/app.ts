// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes';
import shiftsRoutes from './routes/shifts.routes';
import expensesRoutes from './routes/expenses.routes';
import settingsRoutes from './routes/settings.routes';
import statsRoutes from './routes/stats.routes';

import { errorMiddleware } from './middleware/error.middleware';
import { authLimiter, apiLimiter } from './config/rateLimiter';

const app = express();

// ── Security headers ───────────────────────────────────────────────
app.use(helmet());

// ── CORS — only allow known frontend origin ────────────────────────
const allowedOrigin = process.env.FRONTEND_URL!;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// ── Body parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── NoSQL injection sanitization (manual — avoids Express 5 req.query conflict) ──
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: Record<string, any>): void => {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
});

// ── Rate limiting ──────────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// ── Error handling ────────────────────────────────────────────────
app.use(errorMiddleware);


export default app;