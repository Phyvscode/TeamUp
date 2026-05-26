import { Request, Response, NextFunction } from 'express';
import { INotification, NotificationType } from '../types';
import Notification from '../models/Notification';
import User         from '../models/User';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notifications: INotification[] = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar role company')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

export const sendNotification = async (
  req: Request<{}, {}, { recipientId: string; title: string; message: string; type?: NotificationType }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recipientId, title, message, type } = req.body;

    if (!recipientId || !title || !message) {
      res.status(400).json({ message: 'recipientId, title, and message are required.' });
      return;
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({ message: 'Recipient user not found.' });
      return;
    }

    const notification: INotification = await Notification.send({
      recipient: recipientId,
      sender:    req.user._id,
      title,
      message,
      type: type ?? 'info',
    });

    const populated = await notification.populate('sender', 'name avatar role company');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

export const markOneRead = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification: INotification | null = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification: INotification | null = await Notification.findOneAndDelete({
      _id:       req.params.id,
      recipient: req.user._id,
    });
    if (!notification) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count: number = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};