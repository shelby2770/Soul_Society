import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// Book a new appointment
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, patientEmail, type, date, time } = req.body;

    // Verify the patient exists
    let patient = await User.findById(patientId);
    if (!patient) {
      // If patient not found by ID, try finding by email
      patient = await User.findOne({ email: patientEmail });
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }
    }

    // Verify the doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.type !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Create new appointment
    const appointment = new Appointment({
      doctorId,
      patientId: patient._id, // Use the found patient's ID
      patientEmail: patient.email, // Store email as fallback for identification
      type,
      date,
      time,
      status: "Pending",
      paymentStatus: "Pending",
      amount: type === "Online" ? 50 : 100, // Example amounts
    });

    await appointment.save();

    // Populate patient and doctor details for the response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patientId", "name email")
      .populate("doctorId", "name email specialization");

    // Create a notification for the doctor about the new appointment
    try {
      // Format date for better readability
      const formattedDate = new Date(appointment.date).toLocaleDateString();

      const notificationData = {
        recipient: doctor._id,
        sender: patient._id,
        type: "new_appointment",
        title: "New Appointment Request",
        message: `${patient.name} has booked a ${type} appointment with you for ${formattedDate} at ${appointment.time}.`,
        relatedId: appointment._id,
        relatedModel: "Appointment",
      };

      await createNotification(notificationData);
      console.log("Notification created for doctor", doctor.email);
    } catch (notificationError) {
      console.error(
        "Error creating notification for doctor:",
        notificationError
      );
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error booking appointment",
      error: error.message,
    });
  }
};

// Get all appointments for a doctor
export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const appointments = await Appointment.find({ doctorId })
      .populate("patientId", "name email")
      .sort({ date: 1, time: 1 }); // Sort by date and time
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Accept an appointment
export const acceptAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Find and update the appointment
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "Accepted", updatedAt: Date.now() },
      { new: true }
    )
      .populate("patientId", "name email")
      .populate("doctorId", "name email specialization");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Create a notification for the patient
    try {
      const notificationData = {
        recipient: appointment.patientId._id,
        sender: appointment.doctorId._id,
        type: "appointment_accepted",
        title: "Appointment Accepted",
        message: `Dr. ${
          appointment.doctorId.name
        } has accepted your appointment scheduled for ${new Date(
          appointment.date
        ).toLocaleDateString()} at ${appointment.time}.`,
        relatedId: appointment._id,
        relatedModel: "Appointment",
      };

      await createNotification(notificationData);
      console.log(
        "Notification created for patient",
        appointment.patientId.email
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    // Return the updated appointment
    res.json({
      success: true,
      message: "Appointment accepted and patient notified",
      appointment,
    });
  } catch (error) {
    console.error("Error accepting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error accepting appointment",
      error: error.message,
    });
  }
};

// Reschedule an appointment
export const rescheduleAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { date, time } = req.body;

    // Find and update the appointment
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "Rescheduled", date, time, updatedAt: Date.now() },
      { new: true }
    )
      .populate("patientId", "name email")
      .populate("doctorId", "name email specialization");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Create a notification for the patient about the rescheduled appointment
    try {
      // Format date for better readability
      const formattedDate = new Date(appointment.date).toLocaleDateString();

      const notificationData = {
        recipient: appointment.patientId._id,
        sender: appointment.doctorId._id,
        type: "appointment_rescheduled",
        title: "Appointment Rescheduled",
        message: `Dr. ${appointment.doctorId.name} has rescheduled your appointment to ${formattedDate} at ${appointment.time}.`,
        relatedId: appointment._id,
        relatedModel: "Appointment",
      };

      await createNotification(notificationData);
      console.log(
        "Rescheduling notification created for patient",
        appointment.patientId.email
      );
    } catch (notificationError) {
      console.error(
        "Error creating rescheduling notification:",
        notificationError
      );
      // Continue with the response even if notification fails
    }

    res.json({
      success: true,
      message: "Appointment rescheduled and patient notified",
      appointment,
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error rescheduling appointment",
      error: error.message,
    });
  }
};

// Get payment info for a doctor
export const getPaymentsByDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const payments = await Appointment.find({
      doctorId,
      paymentStatus: "Received",
    }).populate("patientId", "name email");
    const totalAmount = payments.reduce((sum, appt) => sum + appt.amount, 0);
    res.json({ success: true, payments, totalAmount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId", "name email")
      .populate("doctorId", "name email specialization");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointment",
      error: error.message,
    });
  }
};

// Get all appointments for a patient
export const getAppointmentsByPatient = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    console.log("Finding appointments for patient ID:", patientId);

    // Log incoming request details
    console.log(
      `Request to get appointments for patient ${patientId} at ${new Date().toISOString()}`
    );

    let appointments = [];

    // Check if patientId looks like an email
    const isEmail = patientId.includes("@");

    if (isEmail) {
      // First try to get the patient by email to get their ID
      const patientByEmail = await User.findOne({ email: patientId }).exec();

      if (patientByEmail) {
        console.log(
          `Found patient by email: ${patientByEmail.name} with ID: ${patientByEmail._id}`
        );
        // Try to find appointments using the patient's proper MongoDB ID
        appointments = await Appointment.find({ patientId: patientByEmail._id })
          .populate("doctorId", "name email specialization")
          .sort({ date: 1, time: 1 });

        console.log(
          `Found ${appointments.length} appointments using patient MongoDB ID`
        );
      }

      // If no appointments found by ID, try by email field
      if (appointments.length === 0) {
        console.log("No appointments found by ID, trying by email field");
        const emailAppointments = await Appointment.find({
          patientEmail: patientId,
        })
          .populate("doctorId", "name email specialization")
          .sort({ date: 1, time: 1 });

        console.log(
          `Found ${emailAppointments.length} appointments by email field`
        );
        appointments = emailAppointments;
      }
    } else {
      // If not an email, try the normal way by ID
      try {
        console.log(`Looking for appointments with patientId: ${patientId}`);
        appointments = await Appointment.find({ patientId })
          .populate("doctorId", "name email specialization")
          .sort({ date: 1, time: 1 });

        console.log(
          `Found ${appointments.length} appointments by direct ID lookup`
        );
      } catch (err) {
        console.error("Error in direct ID lookup:", err.message);
      }
    }

    console.log(`Total appointments found for patient: ${appointments.length}`);

    // Debug appointments data
    if (appointments.length > 0) {
      const debugAppointments = appointments.map((appt) => ({
        id: appt._id,
        doctorName: appt.doctorId?.name || "No doctor name",
        date: appt.date,
        time: appt.time,
        type: appt.type,
        status: appt.status,
      }));
      console.log(
        "Appointments found:",
        JSON.stringify(debugAppointments, null, 2)
      );
    }

    // Check for today's appointments specifically
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = appointments.filter((appt) => {
      const apptDate = new Date(appt.date);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === today.getTime();
    });

    if (todayAppointments.length > 0) {
      console.log(`Found ${todayAppointments.length} appointments for today`);
    }

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patient appointments",
      error: error.message,
    });
  }
};
