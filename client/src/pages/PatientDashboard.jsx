import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Access userData
import axios from "axios";
import Survey from "../components/Survey"; // Your one-question-at-a-time survey

const PatientDashboard = () => {
  const { user, userData } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [surveyScore, setSurveyScore] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData) return;

      const patientId = userData._id;

      try {
        const [appointmentsRes, medicinesRes] = await Promise.all([
          axios.get(`${API_URL}/api/appointments/patient/${patientId}`),
          axios.get(`${API_URL}/api/medicines/patient/${patientId}`),
        ]);

        if (appointmentsRes.data.success)
          setAppointments(appointmentsRes.data.appointments);

        if (medicinesRes.data.success)
          setMedicines(medicinesRes.data.medicines);

        // Set profile directly from MongoDB user data
        setProfile({
          name: userData.name,
          age: userData.age || "N/A",
          consultation: userData.consultation || "N/A",
          visited: userData.visited || "N/A",
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchDashboardData();
  }, [userData]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage) return;
    const newMsg = { from: "patient", text: newMessage, timestamp: new Date() };
    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold text-center mb-6">Patient Dashboard</h1>

      {/* Survey Section */}
      <Survey setSurveyScore={setSurveyScore} />

      {surveyScore !== null && (
        <div className="bg-green-100 p-4 rounded mb-6 text-center">
          <h2 className="text-xl font-bold">Your Survey Score</h2>
          <p className="text-2xl text-green-700 font-semibold">{surveyScore}</p>
        </div>
      )}

      {/* Profile Section */}
      <section className="mb-6">
        <div className="bg-blue-100 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2">{profile.name}</h2>
          <p>Age: {profile.age}</p>
          <p>Consultation: {profile.consultation}</p>
          <p>Visited: {profile.visited}</p>
        </div>
      </section>

      {/* Appointments Section */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-2">Your Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments scheduled.</p>
        ) : (
          <ul className="list-disc pl-5">
            {appointments.map((appt) => (
              <li key={appt._id}>
                {appt.date} at {appt.time} — {appt.type} ({appt.status})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Medicines Section */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-2">Prescribed Medicines</h2>
        {medicines.length === 0 ? (
          <p>No medicines prescribed yet.</p>
        ) : (
          <ul className="list-disc pl-5">
            {medicines.map((med) => (
              <li key={med._id}>
                {med.name} ({med.dosage}) — {med.instructions}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Chat Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Chat with Doctor</h2>
        <div className="bg-gray-100 p-4 rounded-lg h-60 overflow-y-auto mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.from === "patient" ? "text-right" : "text-left"}`}>
              <span className="inline-block bg-blue-200 px-3 py-1 rounded">
                {msg.text}
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded-l px-4 py-2"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-r hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
};

export default PatientDashboard;
