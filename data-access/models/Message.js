const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  convId: {
    type: mongoose.Types.ObjectId,
    ref: 'Conversation',
  },
  author: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  text: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', MessageSchema);
