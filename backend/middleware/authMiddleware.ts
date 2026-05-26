import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

// ── protect ───────────────────────────────────────────────────────────────────
// Verifies the Bearer JWT and attaches the user to req.user.
// req.user is typed globally via types/express.d.ts so all downstream
// handlers can access it without casting.
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Not authenticated. Please log in.' });
      return;
    }

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Session expired. Please log in again.' });
      return;
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
};