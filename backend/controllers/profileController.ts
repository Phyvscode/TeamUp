import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { IUser, IProject } from '../types';
import User from '../models/User';

// ── GET /api/profile ──────────────────────────────────────────────────────────
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/profile ──────────────────────────────────────────────────────────
export const updateProfile = async (
  req: Request<{}, {}, {
    name?: string; email?: string; phone?: string; location?: string;
    bio?: string; skills?: string[]; company?: string; linkedinUrl?: string;
    companyWebsite?: string; companyIndustry?: string; companySize?: string; companyDescription?: string;
  }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name, email, phone, location, bio, skills, company, linkedinUrl,
      companyWebsite, companyIndustry, companySize, companyDescription,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (name               !== undefined) updates.name               = name;
    if (email              !== undefined) updates.email              = email;
    if (phone              !== undefined) updates.phone              = phone;
    if (location           !== undefined) updates.location           = location;
    if (bio                !== undefined) updates.bio                = bio;
    if (skills             !== undefined) updates.skills             = skills;
    if (company            !== undefined) updates.company            = company;
    if (linkedinUrl        !== undefined) updates.linkedinUrl        = linkedinUrl;
    if (companyWebsite     !== undefined) updates.companyWebsite     = companyWebsite;
    if (companyIndustry    !== undefined) updates.companyIndustry    = companyIndustry;
    if (companySize        !== undefined) updates.companySize        = companySize;
    if (companyDescription !== undefined) updates.companyDescription = companyDescription;

    const user: IUser | null = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/avatar ──────────────────────────────────────────────────
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided.' });
      return;
    }
    const user: IUser | null = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: `/uploads/avatars/${req.file.filename}` },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/company-logo ───────────────────────────────────────────
export const uploadCompanyLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided.' });
      return;
    }
    const user: IUser | null = await User.findByIdAndUpdate(
      req.user._id,
      { companyLogo: `/uploads/logos/${req.file.filename}` },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/resume ──────────────────────────────────────────────────
export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No PDF file provided.' });
      return;
    }
    const user: IUser | null = await User.findByIdAndUpdate(
      req.user._id,
      { resumeUrl: `/uploads/resumes/${req.file.filename}` },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/change-password ────────────────────────────────────────
export const changePassword = async (
  req: Request<{}, {}, { currentPassword: string; newPassword: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'currentPassword and newPassword are required.' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ message: 'New password must be at least 8 characters.' });
      return;
    }

    const user = await User.findById(req.user._id).select('+password') as (IUser & { password: string }) | null;
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      res.status(401).json({ message: 'Current password is incorrect.' });
      return;
    }

    await User.updateOne({ _id: req.user._id }, { $set: { password: await bcrypt.hash(newPassword, 12) } });
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/projects ────────────────────────────────────────────────
export const addProject = async (
  req: Request<{}, {}, Omit<IProject, '_id'>>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, techStack, link } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Project title is required.' });
      return;
    }
    const user: IUser | null = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { projects: { title, description, techStack, link } } },
      { new: true }
    );
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/profile/projects/:projectId ───────────────────────────────────
export const deleteProject = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user: IUser | null = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { projects: { _id: req.params.projectId } } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};