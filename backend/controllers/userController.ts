import { Request, Response, NextFunction } from 'express';
import { IUser, IConversation } from '../types';
import User         from '../models/User';
import Conversation from '../models/Conversation';

// ── GET /api/users/applicants ─────────────────────────────────────────────────
export const getApplicants = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const applicants: IUser[] = await User.find({ role: 'applicant' })
      .select('name email avatar bio skills location phone resumeUrl projects createdAt')
      .sort({ createdAt: -1 });
    res.json(applicants);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/applicants/:id ─────────────────────────────────────────────
export const getApplicantById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const applicant: IUser | null = await User.findOne({ _id: req.params.id, role: 'applicant' })
      .select('name email avatar bio skills location phone resumeUrl projects createdAt');
    if (!applicant) {
      res.status(404).json({ message: 'Applicant not found.' });
      return;
    }
    res.json(applicant);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/recruiters ─────────────────────────────────────────────────
export const getRecruiters = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recruiters: IUser[] = await User.find({ role: 'recruiter' })
      .select('name email avatar company')
      .sort({ createdAt: -1 });
    res.json(recruiters);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/users/start-conversation ───────────────────────────────────────
export const startConversation = async (
  req: Request<{}, {}, { targetUserId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetUserId } = req.body;
    const myId = req.user._id;

    if (!targetUserId) {
      res.status(400).json({ message: 'targetUserId is required.' });
      return;
    }
    if (targetUserId.toString() === myId.toString()) {
      res.status(400).json({ message: 'You cannot start a conversation with yourself.' });
      return;
    }

    const target: IUser | null = await User.findById(targetUserId).select('name role company avatar');
    if (!target) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    let conversation: IConversation | null = await Conversation.findOne({
      participants: { $all: [myId, targetUserId] },
    }).populate('participants', 'name role company avatar');

    if (!conversation) {
      conversation = await Conversation.create({ participants: [myId, targetUserId], messages: [] });
      conversation = await conversation.populate('participants', 'name role company avatar');
    }

    const isApplicant = req.user.role === 'applicant';
    const other = (conversation.participants as IUser[]).find(
      (p) => p._id.toString() !== myId.toString()
    );

    res.json({
      id:            conversation._id.toString(),
      recruiterId:   isApplicant ? other?._id : myId,
      recruiterName: isApplicant ? other?.name : req.user.name,
      applicantId:   !isApplicant ? other?._id : myId,
      applicantName: !isApplicant ? other?.name : req.user.name,
      company:       isApplicant ? (other?.company ?? '') : (req.user.company ?? ''),
      position:      '',
      lastMessage:   conversation.lastMessage ?? '',
      unread:        0,
      messages:      [],
    });
  } catch (err) {
    next(err);
  }
};