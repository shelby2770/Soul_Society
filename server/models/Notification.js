import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientFirebaseId: {
      type: String,
    },
    senderFirebaseId: {
      type: String,
    },
    type: {
      type: String,
      enum: [
        "appointment_accepted",
        "appointment_rescheduled",
        "new_message",
        "appointment_reminder",
        "chat_request_approved",
        "chat_request_declined",
        "chat_request_new",
        "new_appointment",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    relatedModel: {
      type: String,
      enum: ["Appointment", "Message", "ChatRequest"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
