const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  users: [
    {
      uid: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
      joined: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Conversation', ConversationSchema);
