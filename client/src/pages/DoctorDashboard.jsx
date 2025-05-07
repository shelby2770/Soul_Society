import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const DoctorDashboard = () => {
  const { user, userData } = useAuth();

  // Sample doctor profile data
  const doctorProfile = {
    name: userData?.name || "Loading...",
    specialization: userData?.specialization || "Psychiatrist",
    email: user?.email || "Loading...",
    phone: userData?.phone || "Not provided",
  };

  // State for medicines and appointments fetched from backend
  const [medicines, setMedicines] = useState([
    {
      id: 1,
      name: "Paracetamol",
      dosage: "500mg",
      instructions: "Take twice daily after meals",
    },
    {
      id: 2,
      name: "Amoxicillin",
      dosage: "250mg",
      instructions: "Take thrice daily for 7 days",
    },
  ]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [error, setError] = useState(null);

  // Form state for new medicine
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");

  // Form state for new appointment
  const [appointmentType, setAppointmentType] = useState("Online");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://soul-society.onrender.com";

  // Check if appointment is today and upcoming (not in the past)
  const isUpcomingToday = (date, time) => {
    const today = new Date();
    const apptDate = new Date(date);

    // Check if same day
    if (
      today.getDate() === apptDate.getDate() &&
      today.getMonth() === apptDate.getMonth() &&
      today.getFullYear() === apptDate.getFullYear()
    ) {
      // Parse appointment time
      const [hours, minutes] = time.split(":").map(Number);
      const apptTime = new Date();
      apptTime.setHours(hours, minutes, 0);

      // Check if appointment is at least within 15 min of current time
      return apptTime.getTime() - today.getTime() > -15 * 60 * 1000;
    }

    return false;
  };

  // Check if it's time to enable the Join Video Call button (20 minutes before appointment time)
  const isTimeToJoinCall = (date, time) => {
    try {
      const now = new Date();
      const apptDate = new Date(date);

      // Check if it's the same day
      const isSameDay =
        now.getDate() === apptDate.getDate() &&
        now.getMonth() === apptDate.getMonth() &&
        now.getFullYear() === apptDate.getFullYear();

      if (!isSameDay) return false;

      // Parse appointment time
      const [hours, minutes] = time.split(":").map(Number);
      const appointmentTime = new Date();
      appointmentTime.setHours(hours, minutes, 0);

      // Calculate time difference in minutes
      const diffInMinutes = (appointmentTime - now) / (1000 * 60);

      // Allow joining 20 minutes before the appointment time and until 30 minutes after
      const canJoin = diffInMinutes <= 20 && diffInMinutes >= -30;

      console.log(
        `Doctor join button for ${time}: ${diffInMinutes.toFixed(
          1
        )} minutes until appointment, canJoin: ${canJoin}`
      );

      return canJoin;
    } catch (error) {
      console.error("Error in isTimeToJoinCall:", error);
      return false;
    }
  };

  // Fetch appointments and payments on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (!userData?.id) {
          console.log(
            "No doctor ID available yet. Current userData:",
            userData
          );
          return;
        }

        console.log("Fetching appointments for doctor:", userData.id);
        const res = await axios.get(
          `${API_URL}/api/appointments/doctor/${userData.id}`
        );
        if (res.data.success) {
          console.log("Fetched appointments:", res.data.appointments);
          setAppointments(res.data.appointments);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setError("Failed to fetch appointments");
      }
    };

    const fetchPayments = async () => {
      try {
        if (!userData?.id) {
          console.log(
            "No doctor ID available yet. Current userData:",
            userData
          );
          return;
        }

        console.log("Fetching payments for doctor:", userData.id);
        const res = await axios.get(
          `${API_URL}/api/appointments/payments/${userData.id}`
        );
        if (res.data.success) {
          console.log("Fetched payments:", res.data.payments);
          setPayments(res.data.payments);
          setTotalPayments(res.data.totalAmount);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
        setError("Failed to fetch payments");
      }
    };

    if (user && userData?.type === "doctor") {
      fetchAppointments();
      fetchPayments();
    }
  }, [user, userData, API_URL]);

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
      patient: {
        id: null,
        name: "New Patient",
        email: "newpatient@example.com",
      }, // Placeholder patient
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
        prev.map((appt) =>
          appt._id === id ? { ...appt, status: "Accepted" } : appt
        )
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
          appt._id === id
            ? { ...appt, status: "Rescheduled", date: newDate, time: newTime }
            : appt
        )
      );
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Doctor Profile Section */}
      <section className="mb-12 border p-4 rounded shadow-sm max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Doctor Profile</h2>
        <p>
          <strong>Name:</strong> {doctorProfile.name}
        </p>
        <p>
          <strong>Specialization:</strong> {doctorProfile.specialization}
        </p>
        <p>
          <strong>Email:</strong> {doctorProfile.email}
        </p>
        <p>
          <strong>Phone:</strong> {doctorProfile.phone}
        </p>
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
                  <p>
                    <strong>Name:</strong> {med.name}
                  </p>
                  <p>
                    <strong>Dosage:</strong> {med.dosage}
                  </p>
                  <p>
                    <strong>Instructions:</strong> {med.instructions}
                  </p>
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
              <option value="In-Person">In-Person</option>
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
            <ul className="space-y-4">
              {appointments.map((appt) => (
                <li
                  key={appt._id}
                  className="border p-4 rounded-lg shadow-sm bg-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-medium text-lg mb-1">
                        {appt.patientId?.name || "Patient"}
                      </p>
                      <p className="text-gray-600">
                        {appt.patientId?.email || "No email provided"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appt.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : appt.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">{appt.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-medium">${appt.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">
                        {new Date(appt.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium">{appt.time}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    {appt.status === "Pending" && (
                      <button
                        onClick={() => handleAcceptAppointment(appt._id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                      >
                        Accept
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const newDate = prompt(
                          "Enter new date (YYYY-MM-DD):",
                          new Date(appt.date).toISOString().split("T")[0]
                        );
                        const newTime = prompt(
                          "Enter new time (HH:MM):",
                          appt.time
                        );
                        if (newDate && newTime) {
                          handleRescheduleAppointment(
                            appt._id,
                            newDate,
                            newTime
                          );
                        }
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Reschedule
                    </button>
                    {appt.type === "Online" &&
                      (appt.status === "Accepted" ||
                        appt.status === "Rescheduled") &&
                      isTimeToJoinCall(appt.date, appt.time) && (
                        <Link
                          to={`/video-consultation/${appt._id}`}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Join Video Call
                        </Link>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Payment Tracking Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Payment Tracking</h2>
        <p>
          <strong>Total Payments Received:</strong> ${totalPayments}
        </p>
        {payments.length === 0 ? (
          <p>No payments received yet.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li
                key={payment._id || payment.id}
                className="border p-3 rounded shadow-sm"
              >
                <p>
                  <strong>Appointment ID:</strong> {payment._id || payment.id}
                </p>
                <p>
                  <strong>Amount:</strong> ${payment.amount}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(payment.date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DoctorDashboard;
