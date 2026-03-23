const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Who triggered it (optional — system notifications have no sender)
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    title:   { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['interview', 'application', 'message', 'info', 'success'],
      default: 'info',
    },
    read: { type: Boolean, default: false },
    // Human-readable timestamp shown in the UI
    time: {
      type: String,
      default: () =>
        new Date().toLocaleString('en-US', {
          month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        }),
    },
  },
  { timestamps: true }
);

// Static helper — send a notification between two users from anywhere
notificationSchema.statics.send = async function ({ recipient, sender = null, title, message, type = 'info' }) {
  return this.create({ recipient, sender, title, message, type });
};

module.exports = mongoose.model('Notification', notificationSchema);