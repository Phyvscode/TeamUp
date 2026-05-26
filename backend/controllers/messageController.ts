import { Request, Response, NextFunction } from 'express';
import { IConversation, IMessage, IUser, SendMessageBody } from '../types';
import Conversation from '../models/Conversation';
import User         from '../models/User';
import Notification from '../models/Notification';

// ── Helper ────────────────────────────────────────────────────────────────────
const fmtTime = (date: Date | string): string =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

interface ShapedConversation {
  id: string;
  recruiterId: string;
  recruiterName: string;
  applicantId: string;
  applicantName: string;
  company: string;
  position: string;
  lastMessage: string;
  unread: number;
  messages: {
    _id: string;
    sender: 'me' | 'recruiter' | 'applicant';
    senderName: string;
    text: string;
    time: string;
  }[];
}

const shapeConversation = (conv: IConversation, currentUser: IUser): ShapedConversation => {
  const userId      = currentUser._id;
  const isApplicant = currentUser.role === 'applicant';

  const other = (conv.participants as IUser[]).find(
    (p) => p._id.toString() !== userId.toString()
  );

  const unread = conv.messages.filter(
    (m: IMessage) => m.sender.toString() !== userId.toString() && !m.read
  ).length;

  return {
    id:            conv._id.toString(),
    recruiterId:   isApplicant ? (other?._id?.toString() ?? '') : userId.toString(),
    recruiterName: isApplicant ? (other?.name ?? '') : currentUser.name,
    applicantId:   !isApplicant ? (other?._id?.toString() ?? '') : userId.toString(),
    applicantName: !isApplicant ? (other?.name ?? '') : currentUser.name,
    company:       isApplicant ? (other?.company ?? '') : (currentUser.company ?? ''),
    position:      '',
    lastMessage:   conv.lastMessage ?? '',
    unread,
    messages: conv.messages.map((m: IMessage) => ({
      _id:        m._id.toString(),
      sender:     m.sender.toString() === userId.toString() ? 'me' : (isApplicant ? 'recruiter' : 'applicant'),
      senderName: m.sender.toString() === userId.toString()
        ? currentUser.name
        : other?.name ?? 'Unknown',
      text: m.text,
      time: fmtTime(m.createdAt ?? new Date()),
    })),
  };
};

// ── GET /api/messages ─────────────────────────────────────────────────────────
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversations: IConversation[] = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name company role avatar')
      .sort({ lastMessageAt: -1 });

    res.json(conversations.map((c) => shapeConversation(c, req.user)));
  } catch (err) {
    next(err);
  }
};

// ── POST /api/messages ────────────────────────────────────────────────────────
export const sendMessage = async (
  req: Request<{}, {}, SendMessageBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !text?.trim()) {
      res.status(400).json({ message: 'receiverId and text are required.' });
      return;
    }
    if (receiverId.toString() === senderId.toString()) {
      res.status(400).json({ message: 'You cannot message yourself.' });
      return;
    }

    const receiver: IUser | null = await User.findById(receiverId);
    if (!receiver) {
      res.status(404).json({ message: 'Receiver not found.' });
      return;
    }

    let conversation: IConversation | null = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({ participants: [senderId, receiverId], messages: [] });
    }

    conversation.messages.push({ sender: senderId, receiver: receiverId, text: text.trim(), read: false } as any);
    conversation.lastMessage   = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const saved: IMessage = conversation.messages[conversation.messages.length - 1];

    await Notification.send({
      recipient: receiverId,
      sender:    senderId,
      title:     `New message from ${req.user.name}`,
      message:   text.length > 80 ? text.slice(0, 77) + '\u2026' : text,
      type:      'message',
    });

    res.status(201).json({
      _id:        saved._id.toString(),
      sender:     'me',
      senderName: req.user.name,
      text:       saved.text,
      time:       fmtTime(saved.createdAt ?? new Date()),
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/messages/:conversationId/read ──────────────────────────────────
export const markAsRead = async (
  req: Request<{ conversationId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversation: IConversation | null = await Conversation.findOne({
      _id:          req.params.conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found.' });
      return;
    }

    conversation.messages.forEach((m: IMessage) => {
      if (m.sender.toString() !== req.user._id.toString()) m.read = true;
    });
    await conversation.save();
    res.json({ message: 'Messages marked as read.' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/messages/:conversationId ──────────────────────────────────────
export const deleteConversation = async (
  req: Request<{ conversationId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversation: IConversation | null = await Conversation.findOne({
      _id:          req.params.conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found.' });
      return;
    }
    await conversation.deleteOne();
    res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    next(err);
  }
};