import React, { useState, useEffect } from "react";
import axios from "axios";
// import PatientDashboard from "../pages/PatientDashboard";

const PatientDashboard = () => {
  const [profile, setProfile] = useState({
    name: "Ibrahim Kadri",
    age: 54,
    consultation: "Individual Therapy",
    visited: "Online",
  });

  const [selfControl, setSelfControl] = useState({
    impulse: 60,
    anxiety: 30,
    attention: 80,
    mood: 70,
    traumatic: 50,
    depression: 65,
  });

  const [weeklyActivities, setWeeklyActivities] = useState({
    quizzes: 4,
    articles: 7,
    medication: 2,
  });

  const [dailyTasks, setDailyTasks] = useState([
    "Stretch",
    "5 Times Salat",
    "Home Workout",
    "Go for a walk",
    "Listen to Quran",
    "Get fresh air outdoors",
    "Read a book",
  ]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchAppointments = async () => {
      const patientId = "patientIdPlaceholder";
      const res = await axios.get(
        `${API_URL}/api/appointments/patient/${patientId}`
      );
      if (res.data.success) setAppointments(res.data.appointments);
    };

    const fetchMedicines = async () => {
      const patientId = "patientIdPlaceholder";
      const res = await axios.get(
        `${API_URL}/api/medicines/patient/${patientId}`
      );
      if (res.data.success) setMedicines(res.data.medicines);
    };

    fetchAppointments();
    fetchMedicines();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage) return;
    const newMsg = { from: "patient", text: newMessage, timestamp: new Date() };
    setMessages([...messages, newMsg]);
    setNewMessage("");
    // Optionally send to backend
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-8">Patient Dashboard</h1>

      {/* Profile Section */}
      <section className="mb-8">
        <div className="bg-blue-100 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold">{profile.name}</h2>
          <p>Age: {profile.age}</p>
          <p>Consultation: {profile.consultation}</p>
          <p>Visited: {profile.visited}</p>
        </div>
      </section>

      {/* Self Control Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Self Control</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(selfControl).map(([key, value]) => (
            <div key={key}>
              <p className="capitalize">
                {key}: {value}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Activities */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Weekly Activities</h2>
        <ul>
          <li>Quizzes: {weeklyActivities.quizzes}</li>
          <li>Articles: {weeklyActivities.articles}</li>
          <li>Medication: {weeklyActivities.medication}</li>
        </ul>
      </section>

      {/* Daily Tasks */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Daily Tasks</h2>
        <ul className="list-disc pl-6">
          {dailyTasks.map((task, idx) => (
            <li key={idx}>{task}</li>
          ))}
        </ul>
      </section>

      {/* Appointments */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments scheduled.</p>
        ) : (
          <ul>
            {appointments.map((appt) => (
              <li key={appt.id}>
                {appt.date} - {appt.type} ({appt.status})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Medicines */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Prescribed Medicines</h2>
        {medicines.length === 0 ? (
          <p>No medicines prescribed yet.</p>
        ) : (
          <ul>
            {medicines.map((med) => (
              <li key={med.id}>
                {med.name} ({med.dosage}) - {med.instructions}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Chat Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Chat with Doctor</h2>
        <div className="bg-gray-100 p-4 rounded-lg h-60 overflow-y-scroll mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 ${
                msg.from === "patient" ? "text-right" : "text-left"
              }`}
            >
              <span className="inline-block px-3 py-1 rounded bg-blue-200">
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
