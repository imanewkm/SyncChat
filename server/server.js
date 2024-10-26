const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5500;

// Initialize HTTP server and attach socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // React App URL
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

// Routes
app.get("/", (req, res) => res.send("Hello World!"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Route to delete all messages for a contact
app.delete("/messages/:contactId", async (req, res) => {
  const { contactId } = req.params;
  try {
    await Message.deleteMany({ contactId });
    res.status(200).json({ message: "Messages deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting messages");
  }
});

// Socket.io Connection
io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  // Join room
  socket.on("joinChat", (contactId) => {
    socket.join(contactId);
    console.log(`User ${socket.id} joined room ${contactId}`);

    // Send messages to user
    Message.find({ contactId }).sort("timestamp").then((messages) => {
      socket.emit("messages", messages);
    });
  });

  // Real-time typing character-by-character transmission
  socket.on("typing", ({ contactId, sender }) => {
    socket.to(contactId).emit("typing", sender);
  });

  // Handle completed messages
  socket.on("message", async ({ contactId, sender, text }) => {
    const message = new Message({ contactId, sender, text });
    await message.save();

    // Broadcast message to room
    io.to(contactId).emit("message", message);
  });

  // Disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

// Start HTTP server with Socket.IO
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
