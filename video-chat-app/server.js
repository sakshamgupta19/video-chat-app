const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server, { cors: { origin: "*" } });
const { ExpressPeerServer } = require("peer");

const opinions = { debug: true };

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use("/peerjs", ExpressPeerServer(server, opinions));

// ✅ Root route: redirect safely to a new random room
app.get("/", (req, res) => {
  const newRoom = uuidv4();
  console.log("Redirecting to room:", newRoom);
  res.redirect(`/${newRoom}`);
});

// ✅ Room route: render EJS view
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);

    // Notify others that a new user joined
    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000);

    // Handle chat messages
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
