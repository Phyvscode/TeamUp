import mongoose, { Schema, Model } from 'mongoose';
import { IConversation, IMessage } from '../types';

// ── Embedded message sub-schema ───────────────────────────────────────────────
const messageSchema = new Schema<IMessage>(
  {
    sender:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text:     { type: String, required: true, trim: true },
    read:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Conversation (thread between exactly two users) ───────────────────────────
const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    messages:      [messageSchema],
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

const Conversation: Model<IConversation> =
  (mongoose.models.Conversation as Model<IConversation>) ||
  mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;