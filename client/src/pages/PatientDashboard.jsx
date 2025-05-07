import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const PatientDashboard = ({ surveyScore: propSurveyScore }) => {
  const { user, userData } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // State for survey data - use prop value or check localStorage
  const [surveyScore, setSurveyScore] = useState(() => {
    if (propSurveyScore !== undefined && propSurveyScore !== null) {
      return propSurveyScore;
    }
    const savedScore = localStorage.getItem("lastSurveyScore");
    return savedScore ? parseInt(savedScore) : null;
  });

  const [recommendationDetails, setRecommendationDetails] = useState(null);

  // Get recommendation details from localStorage if available
  useEffect(() => {
    try {
      const savedRecommendation = localStorage.getItem(
        "lastSurveyRecommendation"
      );
      if (savedRecommendation) {
        setRecommendationDetails(JSON.parse(savedRecommendation));
      }
    } catch (error) {
      console.error("Error parsing saved recommendation:", error);
    }
  }, []);

  // Fetch latest survey from backend when component mounts
  useEffect(() => {
    const fetchLatestSurvey = async () => {
      if (!userData?._id && !user?.uid) return;

      try {
        const userId = userData?._id || user?.uid;
        const response = await axios.get(
          `${API_URL}/api/surveys/latest/${userId}`
        );

        if (response.data.success && response.data.survey) {
          const latestSurvey = response.data.survey;
          setSurveyScore(latestSurvey.score);
          setRecommendationDetails(latestSurvey.recommendation);

          // Update localStorage with latest data
          localStorage.setItem("lastSurveyScore", latestSurvey.score);
          localStorage.setItem(
            "lastSurveyRecommendation",
            JSON.stringify(latestSurvey.recommendation)
          );
        }
      } catch (error) {
        console.error("Error fetching latest survey:", error);
        // Clear survey data if 404 Not Found (user hasn't taken a survey yet)
        if (error.response && error.response.status === 404) {
          // Clear any previously stored survey data
          localStorage.removeItem("lastSurveyScore");
          localStorage.removeItem("lastSurveyRecommendation");
          setSurveyScore(null);
          setRecommendationDetails(null);
        }
        // For other errors, keep any localStorage data if available
      }
    };

    fetchLatestSurvey();
  }, [API_URL, user, userData]);

  // Use recommendation based on surveyScore
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    age: "",
    consultation: "None", // Default value
  });

  // State for recommended doctors
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [specialtyNeeded, setSpecialtyNeeded] = useState("");

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (userData && userData.email) {
          const response = await axios.get(
            `${API_URL}/api/users/email/${userData.email}`
          );

          if (response.data.success && response.data.user) {
            const user = response.data.user;
            setProfile((prev) => ({
              ...prev,
              name: user.name || userData.name || "User",
              email: user.email || userData.email || "",
              age: user.age || "N/A",
            }));
            console.log("User data fetched successfully:", user);
          }
        } else if (user) {
          // Fallback to Firebase user data if MongoDB data not available
          setProfile((prev) => ({
            ...prev,
            name: user.displayName || "User",
            email: user.email || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [API_URL, user, userData]);

  useEffect(() => {
    // Update consultation dynamically when surveyScore changes
    // Use recommendation from recommendation details if available, otherwise calculate based on score

    if (recommendationDetails) {
      setProfile((prevProfile) => ({
        ...prevProfile,
        consultation: recommendationDetails.text || "None",
      }));

      setSpecialtyNeeded(recommendationDetails.type);

      // If we have a specialty recommendation and a survey score, fetch matching doctors
      if (
        recommendationDetails.type &&
        recommendationDetails.type !== "none" &&
        surveyScore > 0
      ) {
        fetchDoctorsBySpecialty(recommendationDetails.type);
      }
    } else {
      let recommendation = "None";
      let specialty = "";

      if (surveyScore > 35) {
        recommendation = "You need a Psychiatrist.";
        specialty = "psychiatrist";
      } else if (surveyScore > 30) {
        recommendation = "You need a Psychologist.";
        specialty = "psychologist";
      } else if (surveyScore > 25) {
        recommendation = "You need a Counselor.";
        specialty = "counselor";
      } else if (surveyScore > 0) {
        recommendation = "You need a Therapist.";
        specialty = "therapist";
      }

      setProfile((prevProfile) => ({
        ...prevProfile,
        consultation: recommendation,
      }));

      setSpecialtyNeeded(specialty);

      // If we have a specialty recommendation and a survey score, fetch matching doctors
      if (specialty && surveyScore > 0) {
        fetchDoctorsBySpecialty(specialty);
      }
    }
  }, [surveyScore, recommendationDetails, API_URL]);

  // Fetch doctors by specialty
  const fetchDoctorsBySpecialty = async (specialty) => {
    setLoadingDoctors(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/doctors/specialty/${specialty}`
      );

      if (response.data.success) {
        setRecommendedDoctors(response.data.doctors || []);
        console.log(
          `Found ${response.data.doctors.length} ${specialty} doctors`
        );
      } else {
        // If the API doesn't have a specific endpoint for specialty, we can try getting all doctors
        // and filtering them client-side
        const allDoctorsResponse = await axios.get(
          `${API_URL}/api/users/type/doctor`
        );

        if (allDoctorsResponse.data.success) {
          // Filter doctors by specialty
          const filteredDoctors = allDoctorsResponse.data.users.filter(
            (doctor) =>
              doctor.specialization &&
              doctor.specialization.toLowerCase().includes(specialty)
          );
          setRecommendedDoctors(filteredDoctors);
          console.log(
            `Found ${filteredDoctors.length} ${specialty} doctors from all doctors`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      // Fallback with mock data in case the API endpoint doesn't exist yet
      setRecommendedDoctors([
        {
          _id: "1",
          name: "Dr. Nasir Hasan",
          specialization: specialty,
          rating: 4.8,
          experience: "10 years",
        },
        {
          _id: "2",
          name: "Dr. Sarah Ahmed",
          specialization: specialty,
          rating: 4.5,
          experience: "8 years",
        },
        {
          _id: "3",
          name: "Dr. Mohammad Khan",
          specialization: specialty,
          rating: 4.7,
          experience: "12 years",
        },
      ]);
    } finally {
      setLoadingDoctors(false);
    }
  };

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
    <div className="bg-gradient-to-b from-blue-50 to-indigo-100 min-h-screen text-gray-800 py-20 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-8">
          Patient Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Section */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
              Profile
            </h2>
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">
                  {profile.name || "Loading..."}
                </h3>
                <p className="text-gray-600 mb-1">
                  {profile.email || "No email available"}
                </p>
                {profile.age && (
                  <p className="text-gray-600">Age: {profile.age}</p>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline">
                    <p className="text-gray-700 w-28 font-medium">
                      Consultation:
                    </p>
                    <p className="text-blue-600">{profile.consultation}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Weekly Activities */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
              Weekly Activities
            </h2>
            <div className="space-y-4">
              {Object.entries(weeklyActivities).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                    <span className="text-indigo-600 font-bold">{value}</span>
                  </div>
                  <span className="capitalize text-gray-700">{key}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/activities">
                <button className="w-full bg-indigo-50 text-indigo-600 font-medium py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                  View All Activities
                </button>
              </Link>
            </div>
          </section>

          {/* Survey Section */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
              Survey Result
            </h2>
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-700">
                  {surveyScore || "N/A"}
                </span>
              </div>
              <p className="text-gray-600">Your last survey score</p>
            </div>
            <Link to="/survey">
              <button className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all hover:-translate-y-1">
                Take New Survey
              </button>
            </Link>
          </section>
        </div>

        {/* Doctor Recommendations Section - Only show if there's a survey score with recommendation */}
        {surveyScore > 0 && specialtyNeeded && (
          <section className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
              Recommended Doctors
            </h2>

            {loadingDoctors ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : recommendedDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="border border-indigo-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {doctor.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>

                    {doctor.rating && (
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm text-gray-700">
                          {doctor.rating} Rating
                        </span>
                      </div>
                    )}

                    {doctor.experience && (
                      <p className="text-sm text-gray-600">
                        {doctor.experience}
                      </p>
                    )}

                    <div className="mt-3 flex space-x-2">
                      <Link
                        to={`/appointments/book/${doctor._id}`}
                        className="flex-1"
                      >
                        <button className="w-full bg-blue-500 text-white py-1.5 px-3 rounded-md text-sm hover:bg-blue-600 transition-colors">
                          Book
                        </button>
                      </Link>
                      <Link to={`/doctor/${doctor._id}`} className="flex-1">
                        <button className="w-full bg-indigo-50 text-indigo-600 py-1.5 px-3 rounded-md text-sm hover:bg-indigo-100 transition-colors">
                          View Profile
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600">
                  No {specialtyNeeded} doctors found at the moment.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Please check back later or contact our support.
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link to="/doctors">
                <button className="bg-indigo-50 text-indigo-600 font-medium py-2 px-6 rounded-lg hover:bg-indigo-100 transition-colors">
                  View All Doctors
                </button>
              </Link>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Self-Control Section */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
              Self Control Metrics
            </h2>
            <div className="space-y-4">
              {Object.entries(selfControl).map(([key, value]) => (
                <div key={key} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <p className="capitalize font-medium text-gray-700">
                      {key}
                    </p>
                    <p className="text-indigo-600 font-semibold">{value}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        value > 70
                          ? "bg-green-500"
                          : value > 40
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Daily Tasks */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
              Daily Tasks
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {dailyTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center p-2 hover:bg-indigo-50 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-indigo-700 text-sm font-bold">
                      {idx + 1}
                    </span>
                  </div>
                  <p className="text-gray-700">{task}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button className="w-full bg-indigo-50 text-indigo-600 font-medium py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                Manage Tasks
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
