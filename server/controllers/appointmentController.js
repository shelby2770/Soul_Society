import Appointment from "../models/Appointment.js";

// Get all appointments for a doctor
export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const appointments = await Appointment.find({ doctorId }).populate(
      "patientId",
      "name email"
    );
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Accept an appointment
export const acceptAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "Accepted", updatedAt: Date.now() },
      { new: true }
    );
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Reschedule an appointment
export const rescheduleAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { date, time } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "Rescheduled", date, time, updatedAt: Date.now() },
      { new: true }
    );
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Get payment info for a doctor
export const getPaymentsByDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const payments = await Appointment.find({
      doctorId,
      paymentStatus: "Received",
    });
    const totalAmount = payments.reduce((sum, appt) => sum + appt.amount, 0);
    res.json({ success: true, payments, totalAmount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
