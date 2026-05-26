import { Request, Response, NextFunction } from 'express';
import { IUser } from '../types';

type UserRole = IUser['role'];

// ── restrictTo ────────────────────────────────────────────────────────────────
// Factory that returns a middleware restricting access to the given roles.
// req.user is available via the global Express.Request augmentation in
// types/express.d.ts (populated by the protect middleware).
export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated. Please log in first.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. This action is restricted to: ${roles.join(', ')}.`,
      });
      return;
    }

    next();
  };
};