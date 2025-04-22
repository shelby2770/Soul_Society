import React, { useState, useEffect } from "react";
import axios from "axios";

const DoctorDashboard = () => {
  // Sample doctor profile data
  const doctorProfile = {
    name: "Dr. John Doe",
    specialization: "Psychiatrist",
    email: "johndoe@example.com",
    phone: "+1 234 567 890",
  };

  // State for medicines and appointments fetched from backend
  const [medicines, setMedicines] = useState([
    { id: 1, name: "Paracetamol", dosage: "500mg", instructions: "Take twice daily after meals" },
    { id: 2, name: "Amoxicillin", dosage: "250mg", instructions: "Take thrice daily for 7 days" },
  ]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);

  // Form state for new medicine
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");

  // Form state for new appointment
  const [appointmentType, setAppointmentType] = useState("Online");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Fetch appointments and payments on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Replace with actual doctor ID or email as needed
        const doctorId = "doctorIdPlaceholder";

        const res = await axios.get(`${API_URL}/api/appointments/doctor/${doctorId}`);
        if (res.data.success) {
          setAppointments(res.data.appointments);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    const fetchPayments = async () => {
      try {
        const doctorId = "doctorIdPlaceholder";
        const res = await axios.get(`${API_URL}/api/appointments/payments/${doctorId}`);
        if (res.data.success) {
          setPayments(res.data.payments);
          setTotalPayments(res.data.totalAmount);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchAppointments();
    fetchPayments();
  }, []);

  // Handlers for adding medicine and appointment (local only)
  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!medicineName || !dosage || !instructions) return;
    const newMedicine = {
      id: medicines.length + 1,
      name: medicineName,
      dosage,
      instructions,
    };
    setMedicines([...medicines, newMedicine]);
    setMedicineName("");
    setDosage("");
    setInstructions("");
  };

  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!appointmentDate || !appointmentTime) return;
    const newAppointment = {
      id: appointments.length + 1,
      type: appointmentType,
      date: appointmentDate,
      time: appointmentTime,
      patient: { id: null, name: "New Patient", email: "newpatient@example.com" }, // Placeholder patient
      status: "Pending",
    };
    setAppointments([...appointments, newAppointment]);
    setAppointmentDate("");
    setAppointmentTime("");
    setAppointmentType("Online");
  };

  // Handlers for accepting and rescheduling appointments
  const handleAcceptAppointment = async (id) => {
    try {
      await axios.put(`${API_URL}/api/appointments/accept/${id}`);
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === id ? { ...appt, status: "Accepted" } : appt))
      );
    } catch (error) {
      console.error("Error accepting appointment:", error);
    }
  };

  const handleRescheduleAppointment = async (id, newDate, newTime) => {
    try {
      await axios.put(`${API_URL}/api/appointments/reschedule/${id}`, {
        date: newDate,
        time: newTime,
      });
      setAppointments((prev) =>
        prev.map((appt) =>
          appt._id === id ? { ...appt, status: "Rescheduled", date: newDate, time: newTime } : appt
        )
      );
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>

      {/* Doctor Profile Section */}
      <section className="mb-12 border p-4 rounded shadow-sm max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Doctor Profile</h2>
        <p><strong>Name:</strong> {doctorProfile.name}</p>
        <p><strong>Specialization:</strong> {doctorProfile.specialization}</p>
        <p><strong>Email:</strong> {doctorProfile.email}</p>
        <p><strong>Phone:</strong> {doctorProfile.phone}</p>
      </section>

      {/* Medicine Prescription Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Prescribe Medicine</h2>
        <form onSubmit={handleAddMedicine} className="space-y-4 max-w-md">
          <div>
            <label className="block mb-1 font-medium">Medicine Name</label>
            <input
              type="text"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g. Paracetamol"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Dosage</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g. 500mg"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g. Take twice daily after meals"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Medicine
          </button>
        </form>

        {/* Display prescribed medicines */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Prescribed Medicines</h3>
          {medicines.length === 0 ? (
            <p>No medicines prescribed yet.</p>
          ) : (
            <ul className="space-y-2">
              {medicines.map((med) => (
                <li key={med.id} className="border p-3 rounded shadow-sm">
                  <p><strong>Name:</strong> {med.name}</p>
                  <p><strong>Dosage:</strong> {med.dosage}</p>
                  <p><strong>Instructions:</strong> {med.instructions}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Appointment Scheduling Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Schedule Appointment</h2>
        <form onSubmit={handleAddAppointment} className="space-y-4 max-w-md">
          <div>
            <label className="block mb-1 font-medium">Appointment Type</label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Date</label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Time</label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Schedule Appointment
          </button>
        </form>

        {/* Display scheduled appointments */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Scheduled Appointments</h3>
          {appointments.length === 0 ? (
            <p>No appointments scheduled yet.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((appt) => (
                <li key={appt._id || appt.id} className="border p-3 rounded shadow-sm">
                  <p><strong>Type:</strong> {appt.type}</p>
                  <p><strong>Date:</strong> {appt.date}</p>
                  <p><strong>Time:</strong> {appt.time}</p>
                  <p><strong>Status:</strong> {appt.status || "Pending"}</p>
                  <p><strong>Patient:</strong> {appt.patient?.name} ({appt.patient?.email})</p>
                  {appt.status !== "Accepted" && (
                    <button
                      onClick={() => handleAcceptAppointment(appt._id || appt.id)}
                      className="mr-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Accept
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const newDate = prompt("Enter new date (YYYY-MM-DD):", appt.date);
                      const newTime = prompt("Enter new time (HH:MM):", appt.time);
                      if (newDate && newTime) {
                        handleRescheduleAppointment(appt._id || appt.id, newDate, newTime);
                      }
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Reschedule
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Payment Tracking Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Payment Tracking</h2>
        <p><strong>Total Payments Received:</strong> ${totalPayments}</p>
        {payments.length === 0 ? (
          <p>No payments received yet.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li key={payment._id || payment.id} className="border p-3 rounded shadow-sm">
                <p><strong>Appointment ID:</strong> {payment._id || payment.id}</p>
                <p><strong>Amount:</strong> ${payment.amount}</p>
                <p><strong>Date:</strong> {new Date(payment.date).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DoctorDashboard;
