const cors = require("cors");
const http = require('http');
const express = require("express");
const app = express();
app.set('port', process.env.PORT || 8800);

var server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "https://frontend-two-pink.vercel.app",
  },
});

//Middleware
app.use(cors());

//CORS
app.use((req,res, next) => {
  res.header("Access-Control-Allow-Origin","*");
  res.header('Access-Control-Allow-Methods','GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials',true);
  next();
});

let activeUsers = [];

io.on("connection", (socket) => {
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // send all active users to new user
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {
    // remove user from active users
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // send all active users to all users
    io.emit("get-users", activeUsers);
  });

  // send message to a specific user
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    console.log("Sending from socket to :", receiverId)
    console.log("Data: ", data)
    if (user) {
      io.to(user.socketId).emit("recieve-message", data);
    }
  });
});

app.get("/", (req, res) => {
  res.send("Socket Corriendo!!")
})

app.listen(app.get('port'), () => {
  console.log(`Server Socket Running On Port ${app.get('port')}`);
});