import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PatientDashboard = ({ surveyScore }) => {
  // Use recommendation based on surveyScore
  const [profile, setProfile] = useState({
    name: "Ibrahim Kadri",
    age: 54,
    consultation: "None", // Default value
    visited: "Online",
  });

  useEffect(() => {
    // Update consultation dynamically when surveyScore changes
    const recommendation =
      surveyScore > 35
        ? "You need a Psychiatrist."
        : surveyScore > 30
        ? "You need a Psychologist."
        : surveyScore > 25
        ? "You need a Counselor."
        : surveyScore > 0
        ? "You need a Therapist."
        : "None";

    setProfile((prevProfile) => ({
      ...prevProfile,
      consultation: recommendation,
    }));
  }, [surveyScore]); // Runs every time surveyScore changes

  const [selfControl] = useState({
    impulse: 60,
    anxiety: 30,
    attention: 80,
    mood: 70,
    traumatic: 50,
    depression: 65,
  });

  const [weeklyActivities] = useState({
    quizzes: 4,
    articles: 7,
    medication: 2,
  });

  const [dailyTasks] = useState([
    "Stretch",
    "5 Times Salat",
    "Home Workout",
    "Go for a walk",
    "Listen to Quran",
    "Get fresh air outdoors",
    "Read a book",
  ]);

  return (
    <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 min-h-screen text-gray-800 py-10 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-6">
          Patient Dashboard
        </h1>

        {/* Profile Section */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700">
            {profile.name}
          </h2>
          <p className="text-gray-600">Age: {profile.age}</p>
          <p className="text-gray-600">
            Consultation: {profile.consultation}
          </p>
          <p className="text-gray-600">Visited: {profile.visited}</p>
        </section>

        {/* Self-Control Section */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Self Control
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(selfControl).map(([key, value]) => (
              <div key={key}>
                <p className="capitalize font-medium text-gray-600">
                  {key}: {value}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Activities */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Weekly Activities
          </h2>
          <ul className="text-gray-600">
            <li>Quizzes: {weeklyActivities.quizzes}</li>
            <li>Articles: {weeklyActivities.articles}</li>
            <li>Medication: {weeklyActivities.medication}</li>
          </ul>
        </section>

        {/* Daily Tasks */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Daily Tasks
          </h2>
          <ul className="list-disc pl-6 text-gray-600">
            {dailyTasks.map((task, idx) => (
              <li key={idx}>{task}</li>
            ))}
          </ul>
        </section>

        {/* Survey Section */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Survey Result
          </h2>
          <p className="text-gray-600 mb-4">
            Your last survey Score: {surveyScore || "N/A"}
          </p>
          <Link to="/survey">
            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-transform">
              Take Survey
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default PatientDashboard;
