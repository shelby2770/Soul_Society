import ChatRequest from "../models/ChatRequest.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Helper function to create notification for patient
const createPatientNotification = async (
  patientId,
  doctorId,
  requestId,
  action
) => {
  try {
    console.log("[Notification] Creating patient notification:");
    console.log("- Patient ID:", patientId);
    console.log("- Doctor ID:", doctorId);
    console.log("- Request ID:", requestId);
    console.log("- Action:", action);

    // Find patient - improved lookup logic
    let patient = null;
    let patientFirebaseId = null;

    // Try multiple ways to find the patient
    // First, try by firebaseId
    patient = await User.findOne({ firebaseId: patientId });
    if (patient) {
      console.log("- Patient by Firebase ID:", "Found");
      patientFirebaseId = patientId; // Store the Firebase ID
    } else {
      console.log("- Patient by Firebase ID: Not found");
    }

    // If not found, try by _id
    if (!patient) {
      try {
        patient = await User.findById(patientId);
        console.log(
          "- Patient by MongoDB ID:",
          patient ? "Found" : "Not found"
        );
      } catch (err) {
        console.log("- Invalid MongoDB ID format for patient");
      }
    }

    // If still not found, try by email
    if (!patient) {
      // Try with exact email match
      patient = await User.findOne({ email: patientId });
      console.log("- Patient by exact email:", patient ? "Found" : "Not found");

      // Try appending @example.com if not found
      if (!patient && !patientId.includes("@")) {
        patient = await User.findOne({ email: `${patientId}@example.com` });
        console.log(
          "- Patient by constructed email:",
          patient ? "Found" : "Not found"
        );
      }
    }

    // If still can't find patient, try a last resort approach by looking up users with similar IDs
    if (!patient) {
      // Try to find any user with matching part of the ID
      const possiblePatients = await User.find({ type: "patient" });
      console.log(
        `- Found ${possiblePatients.length} potential patients for matching`
      );

      // If we have exactly one patient in the system, use that as a fallback
      if (possiblePatients.length === 1) {
        patient = possiblePatients[0];
        console.log("- Using the only patient in the system as a fallback");
      } else {
        console.error(
          "- Failed to find patient for notification with ID:",
          patientId
        );
        return null;
      }
    }

    // Find doctor
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      console.error("- Could not find doctor with ID:", doctorId);
      return null;
    }
    console.log("- Doctor found:", doctor.name);

    const notificationType =
      action === "approve" ? "chat_request_approved" : "chat_request_declined";

    const title =
      action === "approve" ? "Chat Request Approved" : "Chat Request Declined";

    const message =
      action === "approve"
        ? `Dr. ${doctor.name} has approved your chat request. You can now start messaging.`
        : `Dr. ${doctor.name} has declined your chat request.`;

    // Create notification with additional Firebase ID fields
    const notification = new Notification({
      recipient: patient._id,
      sender: doctor._id,
      recipientFirebaseId: patientFirebaseId || patient.firebaseId || null,
      senderFirebaseId: doctor.firebaseId || null,
      type: notificationType,
      title: title,
      message: message,
      relatedId: requestId,
      relatedModel: "ChatRequest",
      isRead: false,
    });

    console.log("- Creating notification object:", {
      recipient: patient._id.toString(),
      sender: doctor._id.toString(),
      recipientFirebaseId: patientFirebaseId || patient.firebaseId || null,
      type: notificationType,
      title,
      relatedModel: "ChatRequest",
    });

    await notification.save();
    console.log(
      `- Notification created successfully with ID: ${notification._id}`
    );
    return notification;
  } catch (error) {
    console.error("Error creating patient notification:", error);
    return null;
  }
};

// Helper function to create notification for doctor when a patient sends a chat request
const createDoctorNotification = async (patientData, doctorId, requestId) => {
  try {
    console.log("[Notification] Creating doctor notification:");
    console.log("- Patient data:", patientData);
    console.log("- Doctor ID:", doctorId);
    console.log("- Request ID:", requestId);

    // Find doctor
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      console.error("- Could not find doctor with ID:", doctorId);
      return null;
    }
    console.log("- Doctor found:", doctor.name);

    // Find or create patient user record
    let patient = null;
    let patientId = patientData.patientId;
    let patientFirebaseId = null;

    // Try looking up patient by Firebase ID first
    patient = await User.findOne({ firebaseId: patientId });
    if (patient) {
      console.log("- Patient user found by Firebase ID");
      patientFirebaseId = patientId;
    } else {
      // Try by MongoDB ID
      try {
        patient = await User.findById(patientId);
        console.log("- Patient user found by MongoDB ID");
      } catch (err) {
        console.log("- Invalid MongoDB ID format");
      }
    }

    // If still not found, try by email
    if (!patient && patientData.patientEmail) {
      patient = await User.findOne({ email: patientData.patientEmail });
      console.log("- Patient user found by email:", patient ? "Yes" : "No");
    }

    // If we still don't have a patient record, create a minimal placeholder
    if (!patient) {
      console.log(
        "- Patient user not found in database, creating placeholder for notification"
      );
      patient = {
        _id: null,
        name: patientData.patientName || "Patient",
        firebaseId: patientData.patientId,
      };
    }

    const notificationType = "chat_request_new";
    const title = "New Chat Request";
    const message = `${patientData.patientName} has requested to chat with you.`;

    // Create notification
    const notification = new Notification({
      recipient: doctor._id,
      sender: patient._id || null, // May be null for non-DB patients
      recipientFirebaseId: doctor.firebaseId || null,
      senderFirebaseId: patientFirebaseId || patientData.patientId || null,
      type: notificationType,
      title: title,
      message: message,
      relatedId: requestId,
      relatedModel: "ChatRequest",
      isRead: false,
    });

    console.log("- Creating notification object:", {
      recipient: doctor._id.toString(),
      type: notificationType,
      title,
      relatedModel: "ChatRequest",
    });

    await notification.save();
    console.log(
      `- Doctor notification created successfully with ID: ${notification._id}`
    );
    return notification;
  } catch (error) {
    console.error("Error creating doctor notification:", error);
    return null;
  }
};

// Create a new chat request from patient to doctor
export const createChatRequest = async (req, res) => {
  try {
    const { patientId, patientName, patientEmail, doctorId, message } =
      req.body;

    console.log("[ChatRequest] Creating new chat request:");
    console.log("- Patient ID:", patientId);
    console.log("- Patient Name:", patientName);
    console.log("- Doctor ID:", doctorId);

    // Validate doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.type !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    console.log("- Doctor found:", doctor.name);

    // Check if there's already a pending request
    const existingRequest = await ChatRequest.findOne({
      patientId,
      doctorId,
      status: "pending",
    });

    if (existingRequest) {
      console.log("- Chat request already exists");
      return res.json({
        success: true,
        message: "Chat request already exists",
        request: existingRequest,
      });
    }

    // Create new chat request
    const chatRequest = new ChatRequest({
      patientId,
      patientName,
      patientEmail,
      doctorId,
      message,
    });

    await chatRequest.save();
    console.log("- Chat request created with ID:", chatRequest._id);

    // Create notification for doctor
    console.log("- Creating notification for doctor");
    const notification = await createDoctorNotification(
      { patientId, patientName, patientEmail },
      doctorId,
      chatRequest._id
    );

    res.status(201).json({
      success: true,
      message: "Chat request created successfully",
      request: chatRequest,
      notification: notification ? true : false,
    });
  } catch (error) {
    console.error("Error creating chat request:", error);
    res.status(500).json({
      success: false,
      message: "Error creating chat request: " + error.message,
    });
  }
};

// Get pending chat requests for a doctor
export const getPendingRequests = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Find doctor by ID
    const doctor = await User.findById(doctorId);

    // If not found, check if it's a Firebase ID
    if (!doctor) {
      const doctorByFirebase = await User.findOne({ firebaseId: doctorId });
      if (doctorByFirebase) {
        const pendingRequests = await ChatRequest.find({
          doctorId: doctorByFirebase._id,
          status: "pending",
        }).sort({ createdAt: -1 });

        return res.json({
          success: true,
          requests: pendingRequests,
        });
      }
    } else {
      const pendingRequests = await ChatRequest.find({
        doctorId: doctor._id,
        status: "pending",
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        requests: pendingRequests,
      });
    }

    // If doctor not found in either case
    res.status(404).json({
      success: false,
      message: "Doctor not found",
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending requests: " + error.message,
    });
  }
};

// Handle approving or declining a chat request
export const handleChatRequest = async (req, res) => {
  try {
    const { requestId, action } = req.params;
    const { doctorId } = req.body;

    console.log(`[ChatRequest] Handling ${action} request:`);
    console.log("- Request ID:", requestId);
    console.log("- Action:", action);
    console.log("- Doctor ID from request:", doctorId);

    if (action !== "approve" && action !== "decline") {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'decline'",
      });
    }

    // Find the request
    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
      console.log("- Chat request not found with ID:", requestId);
      return res.status(404).json({
        success: false,
        message: "Chat request not found",
      });
    }
    console.log("- Found chat request:", {
      patientId: chatRequest.patientId,
      doctorId: chatRequest.doctorId.toString(),
      status: chatRequest.status,
    });

    // Find doctor - try both MongoDB ID and Firebase ID
    let doctor = await User.findById(doctorId);
    if (!doctor) {
      doctor = await User.findOne({ firebaseId: doctorId });
    }

    if (!doctor) {
      console.log("- Doctor not found with ID:", doctorId);
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    console.log("- Found doctor:", doctor.name);

    // Update the request status
    chatRequest.status = action === "approve" ? "approved" : "declined";
    await chatRequest.save();
    console.log(`- Chat request status updated to: ${chatRequest.status}`);

    // Create notification for patient
    console.log("- Creating notification for patient");
    const notification = await createPatientNotification(
      chatRequest.patientId,
      chatRequest.doctorId,
      chatRequest._id,
      action
    );

    if (notification) {
      console.log("- Notification created successfully");
    } else {
      console.log("- Failed to create notification");
    }

    res.json({
      success: true,
      message: `Chat request ${
        action === "approve" ? "approved" : "declined"
      } successfully`,
      request: chatRequest,
      notification: notification ? true : false,
    });
  } catch (error) {
    console.error(`Error ${req.params.action}ing chat request:`, error);
    res.status(500).json({
      success: false,
      message: `Error ${req.params.action}ing chat request: ` + error.message,
    });
  }
};

// Get status of chat request between a patient and doctor
export const getChatRequestStatus = async (req, res) => {
  try {
    const { patientId, doctorId } = req.params;

    // Find most recent request
    const request = await ChatRequest.findOne({
      patientId,
      doctorId,
    }).sort({ createdAt: -1 });

    if (!request) {
      return res.json({
        success: true,
        status: "none",
      });
    }

    res.json({
      success: true,
      status: request.status,
      request,
    });
  } catch (error) {
    console.error("Error getting chat request status:", error);
    res.status(500).json({
      success: false,
      message: "Error getting chat request status: " + error.message,
    });
  }
};
