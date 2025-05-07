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

    // Track active users by their MongoDB ID
    const activeUsers = new Map();

    // Track video rooms and users in them
    const videoRooms = new Map();

    // Socket.IO connection handler
    io.on("connection", (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // Handle user going online
      socket.on("user_online", (userData) => {
        if (userData && userData.userId) {
          console.log(`User online: ${userData.userId} (${userData.userName})`);

          // Store user data in the active users map
          activeUsers.set(userData.userId, {
            socketId: socket.id,
            userName: userData.userName,
            userType: userData.userType,
            lastActive: new Date(),
          });

          // Broadcast to all clients that this user is online
          io.emit("active_users", Array.from(activeUsers.keys()));
        }
      });

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

      // Video call handlers
      socket.on(
        "join_video_room",
        ({ appointmentId, userId, name, isDoctor }) => {
          console.log(
            `User ${name} (${userId}) joining video room: ${appointmentId}`
          );

          // Join the socket room
          socket.join(appointmentId);

          // Initialize room if it doesn't exist
          if (!videoRooms.has(appointmentId)) {
            videoRooms.set(appointmentId, new Set());
          }

          // Add user to the room
          const room = videoRooms.get(appointmentId);
          room.add({
            socketId: socket.id,
            userId,
            name,
            isDoctor,
          });

          // Notify everyone in the room that this user joined
          socket.to(appointmentId).emit("user_joined", { userId, name });

          // Send the current users in the room to the joining user
          socket.emit("room_joined", {
            users: Array.from(room).map((user) => ({
              userId: user.userId,
              name: user.name,
              isDoctor: user.isDoctor,
            })),
          });
        }
      );

      // Handle signaling for WebRTC
      socket.on("offer", ({ appointmentId, offer }) => {
        console.log(
          `Received offer from ${socket.id} for room ${appointmentId}`
        );
        socket.to(appointmentId).emit("offer", { offer });
      });

      socket.on("answer", ({ appointmentId, answer }) => {
        console.log(
          `Received answer from ${socket.id} for room ${appointmentId}`
        );
        socket.to(appointmentId).emit("answer", { answer });
      });

      socket.on("ice_candidate", ({ appointmentId, candidate }) => {
        console.log(
          `Received ICE candidate from ${socket.id} for room ${appointmentId}`
        );
        socket.to(appointmentId).emit("ice_candidate", { candidate });
      });

      socket.on("end_call", ({ appointmentId }) => {
        console.log(`User ${socket.id} ending call in room ${appointmentId}`);
        socket.to(appointmentId).emit("call_ended");

        // Remove user from video room
        if (videoRooms.has(appointmentId)) {
          const room = videoRooms.get(appointmentId);
          for (const user of room) {
            if (user.socketId === socket.id) {
              room.delete(user);
              break;
            }
          }

          // If room is empty, delete it
          if (room.size === 0) {
            videoRooms.delete(appointmentId);
          }
        }

        // Leave the socket room
        socket.leave(appointmentId);
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

        // Update user's last active timestamp
        for (const [userId, userData] of activeUsers.entries()) {
          if (userData.socketId === socket.id) {
            userData.lastActive = new Date();
            activeUsers.set(userId, userData);
            break;
          }
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);

        // Clean up video rooms
        for (const [roomId, room] of videoRooms.entries()) {
          for (const user of room) {
            if (user.socketId === socket.id) {
              room.delete(user);
              // Notify others in the room
              socket.to(roomId).emit("user_left", {
                userId: user.userId,
                name: user.name,
              });
              break;
            }
          }

          // If room is empty, delete it
          if (room.size === 0) {
            videoRooms.delete(roomId);
          }
        }

        // Find and remove the disconnected user from active users
        for (const [userId, userData] of activeUsers.entries()) {
          if (userData.socketId === socket.id) {
            activeUsers.delete(userId);
            console.log(`User ${userId} is now offline`);
            break;
          }
        }

        // Broadcast updated active users list
        io.emit("active_users", Array.from(activeUsers.keys()));
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
