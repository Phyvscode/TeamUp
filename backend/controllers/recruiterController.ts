import { Request, Response, NextFunction } from 'express';
import { IApplication, IInterview } from '../types';
import Application from '../models/Application';
import Interview   from '../models/Interview';

// ── GET /api/recruiter/applicants ─────────────────────────────────────────────
export const getApplicants = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const applications: IApplication[] = await Application.find();
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/recruiter/dashboard ──────────────────────────────────────────────
export const getDashboard = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [applications, interviews]: [IApplication[], IInterview[]] = await Promise.all([
      Application.find(),
      Interview.find(),
    ]);
    res.json({ applications, interviews });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/recruiter/analytics ──────────────────────────────────────────────
export const getAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [applications, interviews]: [IApplication[], IInterview[]] = await Promise.all([
      Application.find(),
      Interview.find(),
    ]);

    res.json({
      totalApplicants: applications.length,
      interviewsDone:  interviews.filter((i) => i.status === 'completed').length,
      offers:          applications.filter((a) => a.status === 'offered').length,
    });
  } catch (err) {
    next(err);
  }
};