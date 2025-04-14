import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  database_url:
    "mongodb+srv://ajmistiaque:LSXJMYrbJ3s8i0Bf@cluster0.uvq0uff.mongodb.net/soul_society?appName=Cluster0",
  port: process.env.PORT || 5000,
};

async function server() {
  try {
    const connection = await mongoose.connect(config.database_url);
    console.log(`Connected to database: ${connection.connection.name}`);

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both client origins
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Socket.IO connection handler
    io.on("connection", (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // Join a conversation room
      socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(
          `Socket ${socket.id} joined conversation: ${conversationId}`
        );
      });

      // Leave a conversation room
      socket.on("leave_conversation", (conversationId) => {
        socket.leave(conversationId);
        console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
      });

      // Listen for new messages
      socket.on("send_message", (messageData) => {
        console.log(
          `New message in conversation ${messageData.conversationId}`
        );
        // Broadcast to everyone in the conversation except the sender
        socket
          .to(messageData.conversationId)
          .emit("receive_message", messageData);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // Export io instance to make it available in other files
    app.set("socketio", io);

    // Start the server
    httpServer.listen(config.port, () => {
      console.log(
        `Server with Socket.IO is running on port ${config.port} 🏃🏽‍♂️‍➡️`
      );
    });
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

server();
