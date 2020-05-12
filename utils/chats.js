const UserModel = require('../data-access/models/User');
const ConversationModel = require('../data-access/models/Conversation');
const MessageModel = require('../data-access/models/Message');

// Redis can be used to store the online users
var onlineUsers = [];

function getOnline() {
  return onlineUsers;
}
function addOnline(id) {
  onlineUsers.push(id);
  return true;
}
function removeOnline(id) {
  onlineUsers.splice(onlineUsers.indexOf(id), 1);
  return true;
}

async function getSideBar(userId) {
  const [convs, users] = await Promise.all([
    ConversationModel.find(
      { 'users.uid': userId },
      { _id: 1, users: 1, created: 1 }
    )
      .populate({ path: 'users.uid', select: ['username'] })
      .lean(),
    UserModel.find({ _id: { $ne: userId } }, { username: 1 })
      .sort({ created: -1 })
      .lean(),
  ]);
  let conversations = [];
  for (let i = 0; i < convs.length; i++) {
    let messages = await MessageModel.find({ convId: convs[i]._id }).sort({
      created: -1,
    });
    if (messages.length > 0) {
      conversations.push({
        id: convs[i]._id,
        users: convs[i].users,
        created: convs[i].created,
      });
    }
  }

  return (data = { conversations, users });
}

async function startNewConversation({ userId, data }) {
  const reqUser = await UserModel.findOne({ username: data.username }).lean();
  let conversation = await ConversationModel.findOne({
    $and: [{ 'users.uid': userId }, { 'users.uid': reqUser._id }],
  }).lean();
  if (!reqUser) {
    return {
      success: false,
    };
  }
  if (!conversation) {
    conversation = await new ConversationModel({
      users: [{ uid: userId }, { uid: reqUser._id }],
    }).save();
  }
  return {
    success: true,
    cid: conversation._id,
    for: { id: reqUser._id, username: reqUser.username },
    created: conversation.created,
  };
}

async function getMessages(cid) {
  const messages = await MessageModel.find(
    { convId: cid },
    { author: 1, text: 1, created: 1 }
  )
    .sort({
      created: 1,
    })
    .lean();
  return messages;
}

async function addMessage({ userId, cid, text }) {
  await new MessageModel({
    convId: cid,
    author: userId,
    text: text,
  }).save();
}

module.exports = {
  getOnline,
  addOnline,
  removeOnline,
  getSideBar,
  startNewConversation,
  getMessages,
  addMessage,
};
