import mongoose from "mongoose";
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
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port} 🏃🏽‍♂️‍➡️`);
    });
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

server();
