import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign(
    { auth: true },
    process.env.JWT_SECRET || 'changeme',
    { expiresIn: '30d' }
  );
  return res.json({ token });
});

export default router;
