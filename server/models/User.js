import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["patient", "doctor"],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Firebase ID for linking with Firebase Auth
  firebaseId: {
    type: String,
    sparse: true,
    index: true,
  },
  // Doctor specific fields
  specialization: {
    type: String,
    required: function () {
      return this.type === "doctor";
    },
    enum: ["psychiatrist", "psychologist", "counselor", "therapist", "other"],
  },
  cvFileName: {
    type: String,
    required: function () {
      return this.type === "doctor";
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("User", userSchema);

export default User;
