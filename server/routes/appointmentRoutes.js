import express from "express";
import * as appointmentController from "../controllers/appointmentController.js";

const router = express.Router();

// Book a new appointment
router.post("/book", appointmentController.bookAppointment);

// Get all appointments for a doctor
router.get("/doctor/:doctorId", appointmentController.getAppointmentsByDoctor);

// Get all appointments for a patient
router.get(
  "/patient/:patientId",
  appointmentController.getAppointmentsByPatient
);

// Get appointment by ID
router.get("/:id", appointmentController.getAppointmentById);

// Accept an appointment
router.put("/accept/:id", appointmentController.acceptAppointment);

// Reschedule an appointment
router.put("/reschedule/:id", appointmentController.rescheduleAppointment);

// Get payment info for a doctor
router.get("/payments/:doctorId", appointmentController.getPaymentsByDoctor);

export default router;
