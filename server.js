const path = require("path"),
  http = require("http"),
  bodyParser = require("body-parser"),
  express = require("express"),
  allRoutes = require("./routes/index"),
  mongoose = require("mongoose"),
  compression = require("compression"),
  session = require("express-session");

require("dotenv").config();
const {
  getSideBar,
  startNewConversation,
  getMessages,
  addMessage,
  getOnline,
  addOnline,
  removeOnline,
} = require("./utils/chats");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")({
  pingTimeout: 20000,
  pingInterval: 10000,
}).listen(server);

let userSession = session({
  secret:
    process.env.SESSION_SECRET || "temporarySecretcannot$55bedecoded@&9669^8",
  resave: true,
  saveUninitialized: true,
  authenticated: false,
});
app.use(userSession);

app.use(bodyParser.json({ limit: "0.2mb" })); // application/json

// Set static folder
app.use(compression());

app.all("*", allRoutes);
app.use(express.static(path.join(__dirname, "public")));

io.set("transports", ["websocket"]);

io.use((socket, next) => {
  userSession(socket.request, socket.request.res || {}, next);
});

// Run when client connects
io.sockets.on("connection", async (socket) => {
  if (!socket.request.session.authenticated) {
    socket.disconnect();
  }

  addOnline(socket.request.session.user.id);

  const data = await getSideBar(socket.request.session.user.id);

  // Join previous convs
  data.conversations.forEach((e) => {
    socket.join(e.id);
  });

  // Send conversation history and users
  socket.emit("sidebarInfo", { viewer: socket.request.session.user, ...data });
  io.emit("status", getOnline());

  // Start a new conversation, id will be constant for both sides.
  socket.on("newConv", async (data) => {
    const res = await startNewConversation({
      userId: socket.request.session.user.id,
      data,
    });
    socket.join(res.cid);
    socket.emit("newConRes", res);
  });

  // Will not send message to the user if he is not in the room. Can use redis to store user socket sessions and room info.
  socket.on("newMessage", async (data) => {
    await addMessage({ userId: socket.request.session.user.id, ...data });
    socket
      .to(data.cid)
      .emit("message", { userFrom: socket.request.session.user.id, ...data });
  });

  // access chat message. Can be done by simple xhr request as well.
  socket.on("chatsFor", async (cid) => {
    const data = await getMessages(cid);
    socket.emit("chats", data);
  });

  socket.on("disconnect", () => {
    removeOnline(socket.request.session.user.id);
    socket.broadcast.emit("status", getOnline());
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const db = process.env.DBURL;

mongoose
  .connect(db, {
    useFindAndModify: false,
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));
