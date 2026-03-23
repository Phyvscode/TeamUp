const mongoose = require('mongoose');

// ── Embedded message sub-document ────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:     { type: String, required: true, trim: true },
    read:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Conversation (thread between exactly two users) ───────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    messages:      [messageSchema],
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);