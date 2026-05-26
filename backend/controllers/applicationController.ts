import { Request, Response, NextFunction } from 'express';
import {
  IApplication,
  ApplicationStatus,
  CreateApplicationBody,
  UpdateStatusBody,
} from '../types';
import Application  from '../models/Application';
import Notification from '../models/Notification';

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter =
      req.user.role === 'applicant'
        ? { applicant: req.user._id }
        : { recruiter: req.user._id };

    const applications: IApplication[] = await Application.find(filter).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

export const createApplication = async (
  req: Request<{}, {}, CreateApplicationBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { position, company, recruiterId } = req.body;

    if (!position || !company) {
      res.status(400).json({ message: 'position and company are required.' });
      return;
    }

    const application: IApplication = await Application.create({
      applicant:     req.user._id,
      applicantName: req.user.name,
      position,
      company,
      recruiter: recruiterId || undefined,
    });

    if (recruiterId) {
      await Notification.send({
        recipient: recruiterId,
        sender:    req.user._id,
        title:    'New Application Received',
        message:  `${req.user.name} applied for the ${position} position at ${company}.`,
        type:     'application',
      });
    }

    await Notification.send({
      recipient: req.user._id,
      title:    'Application Submitted',
      message:  `Your application for ${position} at ${company} was submitted successfully.`,
      type:     'success',
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (
  req: Request<{ id: string }, {}, UpdateStatusBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const valid: ApplicationStatus[] = ['applied', 'reviewing', 'interview', 'offered', 'rejected'];

    if (!valid.includes(status)) {
      res.status(400).json({ message: `status must be one of: ${valid.join(', ')}.` });
      return;
    }

    const application: IApplication | null = await Application.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      { status },
      { new: true }
    );

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    const statusMessages: Partial<Record<ApplicationStatus, string>> = {
      reviewing: 'Your application is now under review. We will be in touch soon.',
      interview: 'Great news! You have been shortlisted for an interview.',
      offered:   'Congratulations! You have received a job offer.',
      rejected:  'Thank you for your interest. Unfortunately you were not selected this time.',
    };

    const statusMessage = statusMessages[status as keyof typeof statusMessages];

    if (statusMessage) {
      const notifType =
        status === 'offered'   ? ('success'   as const) :
        status === 'interview' ? ('interview' as const) :
        ('info'               as const);

      await Notification.send({
        recipient: application.applicant,
        sender:    req.user._id,
        title:    `Application Update — ${application.position}`,
        message:  statusMessage,
        type:     notifType,
      });
    }

    res.json(application);
  } catch (err) {
    next(err);
  }
};

export const deleteApplication = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const application: IApplication | null = await Application.findOneAndDelete({
      _id:       req.params.id,
      applicant: req.user._id,
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    res.json({ message: 'Application withdrawn successfully.' });
  } catch (err) {
    next(err);
  }
};