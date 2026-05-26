import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { IUser, SignupBody, LoginBody } from '../types';

import User          from '../models/User';
import PasswordReset from '../models/PasswordReset';

const signToken = (id: string): string => {
  const secret  = process.env.JWT_SECRET as string;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign({ id }, secret, options);
};

const sendAuthResponse = (res: Response, statusCode: number, user: IUser): void => {
  const token = signToken(user._id.toString());
  res.status(statusCode).json({ token, user });
};

export const signup = async (
  req: Request<{}, {}, SignupBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'name, email, password, and role are all required.' });
      return;
    }
    if (!['applicant', 'recruiter'].includes(role)) {
      res.status(400).json({ message: 'role must be "applicant" or "recruiter".' });
      return;
    }

    const exists: IUser | null = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    const user: IUser = await User.create({ name, email, password, role });
    sendAuthResponse(res, 201, user);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user: IUser | null = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    (user as any).password = undefined;
    sendAuthResponse(res, 200, user);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.user._id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }

    const user: IUser | null = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ message: 'If that email exists, a code has been sent.' });
      return;
    }

    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    const code       = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);

    await PasswordReset.create({
      email:     email.toLowerCase(),
      code:      hashedCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"HireFlow" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: 'HireFlow - Password Reset Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;border-radius:16px;border:1px solid #2a2a2a;">
          <h1 style="color:#f97316;font-size:28px;margin:0 0 8px;">HireFlow</h1>
          <h2 style="color:#ffffff;font-size:20px;margin:0 0 24px;">Password Reset</h2>
          <p style="color:#a1a1aa;margin:0 0 24px;">Hi ${user.name}, here is your verification code:</p>
          <div style="background:#1a1a1a;border:1px solid #f97316;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#f97316;">${code}</span>
          </div>
          <p style="color:#a1a1aa;font-size:14px;margin:0 0 8px;">This code expires in <strong style="color:#fff;">15 minutes</strong>.</p>
          <p style="color:#a1a1aa;font-size:14px;">You have <strong style="color:#fff;">3 attempts</strong> before being locked out for 1 hour.</p>
        </div>
      `,
    });

    res.json({ message: 'If that email exists, a code has been sent.' });
  } catch (err) {
    next(err);
  }
};

export const verifyResetCode = async (
  req: Request<{}, {}, { email: string; code: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ message: 'email and code are required.' });
      return;
    }

    const record = await PasswordReset.findOne({ email: email.toLowerCase() });
    if (!record) {
      res.status(400).json({ message: 'No reset request found. Please request a new code.' });
      return;
    }

    if (record.lockedUntil && record.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 60000);
      res.status(429).json({
        message:     `Too many incorrect attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        lockedUntil: record.lockedUntil,
      });
      return;
    }

    if (record.expiresAt < new Date()) {
      await PasswordReset.deleteOne({ _id: record._id });
      res.status(400).json({ message: 'Code has expired. Please request a new one.' });
      return;
    }

    const match: boolean = await bcrypt.compare(code, record.code);
    if (!match) {
      record.attempts += 1;
      if (record.attempts >= 3) {
        record.lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
        await record.save();
        res.status(429).json({
          message:     'Too many incorrect attempts. You are locked out for 1 hour.',
          lockedUntil: record.lockedUntil,
        });
        return;
      }
      await record.save();
      const remaining = 3 - record.attempts;
      res.status(400).json({
        message:      `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        attemptsLeft: remaining,
      });
      return;
    }

    record.verified = true;
    record.attempts = 0;
    await record.save();

    const resetToken = jwt.sign(
      { email: email.toLowerCase(), purpose: 'password-reset' },
      process.env.JWT_SECRET as string,
      { expiresIn: '5m' } as SignOptions
    );

    res.json({ message: 'Code verified.', resetToken });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (
  req: Request<{}, {}, { resetToken: string; newPassword: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      res.status(400).json({ message: 'resetToken and newPassword are required.' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters.' });
      return;
    }

    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    } catch {
      res.status(400).json({ message: 'Reset token is invalid or expired. Please start over.' });
      return;
    }

    if (decoded.purpose !== 'password-reset') {
      res.status(400).json({ message: 'Invalid token.' });
      return;
    }

    const record = await PasswordReset.findOne({ email: decoded.email, verified: true });
    if (!record) {
      res.status(400).json({ message: 'Reset session expired. Please start over.' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ email: decoded.email }, { $set: { password: hashed } });
    await PasswordReset.deleteMany({ email: decoded.email });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};