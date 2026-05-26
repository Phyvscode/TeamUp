import mongoose, { Schema, Model } from 'mongoose';
import { INotification, INotificationModel, NotificationType } from '../types';

// ── Merge document interface with static methods ───────────────────────────────
type NotificationModel = Model<INotification> & INotificationModel;

const notificationSchema = new Schema<INotification>(
  {
    // Who receives this notification
    recipient: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    // Who triggered it (null for system notifications)
    sender: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type:    String,
      enum:    ['interview', 'application', 'message', 'info', 'success'],
      default: 'info',
    },
    read: { type: Boolean, default: false },
    // Human-readable timestamp shown in the UI
    time: {
      type:    String,
      default: () =>
        new Date().toLocaleString('en-US', {
          month:  'short',
          day:    'numeric',
          hour:   'numeric',
          minute: '2-digit',
        }),
    },
  },
  { timestamps: true }
);

// ── Static helper — send a notification from anywhere in the codebase ─────────
notificationSchema.statics.send = async function (params: {
  recipient: mongoose.Types.ObjectId | string;
  sender?:   mongoose.Types.ObjectId | string | null;
  title:     string;
  message:   string;
  type?:     NotificationType;
}): Promise<INotification> {
  const { recipient, sender = null, title, message, type = 'info' } = params;
  return this.create({ recipient, sender, title, message, type });
};

const Notification: NotificationModel =
  (mongoose.models.Notification as NotificationModel) ||
  mongoose.model<INotification, NotificationModel>('Notification', notificationSchema);

export default Notification;