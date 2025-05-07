import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import axios from "axios";

const PatientAppointments = () => {
  const { user, userData } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  const [fetchError, setFetchError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Redirect if not logged in or not a patient
    if (!user || userData?.type !== "patient") {
      console.log("first");
      //   navigate("/");
      return;
    }

    const fetchAppointments = async () => {
      try {
        setFetchError(null);

        // Make sure we have some identifier for the patient
        if (!user?.email) {
          console.log("No patient email available");
          if (fetchAttempt < 3) {
            setTimeout(() => setFetchAttempt((prev) => prev + 1), 1000);
          } else {
            setFetchError(
              "Unable to identify patient. Please try logging in again."
            );
            setLoading(false);
          }
          return;
        }

        // Use email as the most reliable identifier
        const patientIdentifier = user.email;
        console.log(
          "Fetching appointments for patient email:",
          patientIdentifier
        );

        const response = await axios.get(
          `${API_URL}/api/appointments/patient/${patientIdentifier}`
        );

        if (response.data.success) {
          console.log("Appointments fetched:", response.data.appointments);
          setAppointments(response.data.appointments);
        } else {
          console.log("No success in response:", response.data);
          setFetchError("Failed to get appointment data");
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setFetchError(`Failed to load appointments: ${err.message}`);
        showError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, userData, fetchAttempt, API_URL, navigate, showError]);

  // Check if appointment is today and upcoming (not in the past)
  const isUpcomingToday = (date, time) => {
    try {
      const today = new Date();
      // Force converting to Date object if it's a string
      const apptDate = new Date(date);

      console.log("Checking appointment:", { date, time });
      console.log("Today:", today.toLocaleDateString());
      console.log("Appointment date:", apptDate.toLocaleDateString());

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

        const currentTime = new Date();

        // Calculate time difference in minutes
        const diffInMinutes = Math.floor(
          (apptTime - currentTime) / (1000 * 60)
        );

        console.log("Appointment time check:", {
          apptTime: apptTime.toLocaleTimeString(),
          currentTime: currentTime.toLocaleTimeString(),
          timeDifferenceMinutes: diffInMinutes,
          isUpcoming: diffInMinutes > -15,
        });

        // Check if appointment is upcoming or within 15 minutes after start time
        // This allows appointments that just started to still be shown
        return diffInMinutes > -15;
      }

      return false;
    } catch (error) {
      console.error("Error in isUpcomingToday:", error);
      return false;
    }
  };

  // Check if appointment is in the future (including today)
  const isFuture = (date) => {
    try {
      // Use the current date without time
      const today = new Date();
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      // Ensure date is properly formatted
      const apptDate = new Date(date);
      const appointmentDate = new Date(
        apptDate.getFullYear(),
        apptDate.getMonth(),
        apptDate.getDate()
      );

      // Check if date is today or in the future
      const result = appointmentDate >= todayDate;
      console.log("Future check:", {
        date,
        today: todayDate.toLocaleDateString(),
        apptDate: appointmentDate.toLocaleDateString(),
        isFuture: result,
      });

      return result;
    } catch (error) {
      console.error("Error in isFuture:", error);
      return false;
    }
  };

  // Check if an appointment is in the past (either past date or past time today)
  const isPast = (date, time) => {
    try {
      const today = new Date();
      const apptDate = new Date(date);

      // Compare dates without time first
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const appointmentDate = new Date(
        apptDate.getFullYear(),
        apptDate.getMonth(),
        apptDate.getDate()
      );

      // If the date is in the past, it's definitely a past appointment
      if (appointmentDate < todayDate) {
        console.log(`Appointment date ${date} is in the past`);
        return true;
      }

      // If today, check if the time has passed
      if (appointmentDate.getTime() === todayDate.getTime()) {
        // Parse appointment time
        const [hours, minutes] = time.split(":").map(Number);
        const apptTimeToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          hours,
          minutes
        );

        // If appointment time is more than 15 minutes in the past, consider it a past appointment
        const isPastTime =
          apptTimeToday.getTime() - today.getTime() < -15 * 60 * 1000;
        console.log(
          `Today's appointment at ${time} is ${
            isPastTime ? "past" : "not past"
          }`
        );
        return isPastTime;
      }

      return false;
    } catch (error) {
      console.error("Error in isPast:", error);
      return false;
    }
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
        `Join button for ${time}: ${diffInMinutes.toFixed(
          1
        )} minutes until appointment, canJoin: ${canJoin}`
      );

      return canJoin;
    } catch (error) {
      console.error("Error in isTimeToJoinCall:", error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* <h1 className="text-3xl font-bold mb-8">My Appointments</h1> */}
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-600">{fetchError}</p>
          <button
            onClick={() => setFetchAttempt((prev) => prev + 1)}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Debug the appointments data
  console.log("All appointments:", appointments);

  // Filter out appointments with invalid doctor IDs
  const validAppointments = appointments.filter(
    (appt) =>
      appt &&
      appt.doctorId &&
      (appt.doctorId._id || typeof appt.doctorId === "string")
  );
  console.log("Valid appointments:", validAppointments.length);

  // First identify past appointments
  const pastAppointments = validAppointments.filter((appt) =>
    isPast(appt.date, appt.time)
  );
  console.log("Past appointments after filter:", pastAppointments);

  // Store past appointment IDs for easy lookup
  const pastAppointmentIds = new Set(pastAppointments.map((appt) => appt._id));

  // Today's appointments (upcoming today and not in past)
  const todayAppointments = validAppointments.filter((appt) => {
    // Skip if it's already classified as past
    if (pastAppointmentIds.has(appt._id)) return false;

    // Check if the appointment is today
    const today = new Date();
    const apptDate = new Date(appt.date);

    return (
      today.getDate() === apptDate.getDate() &&
      today.getMonth() === apptDate.getMonth() &&
      today.getFullYear() === apptDate.getFullYear()
    );
  });
  console.log("Today's appointments after filter:", todayAppointments);

  // Today's appointment IDs for easy lookup
  const todayAppointmentIds = new Set(
    todayAppointments.map((appt) => appt._id)
  );

  // Get appointment dates that are truly future (not today and not past)
  const upcomingAppointments = validAppointments.filter((appt) => {
    try {
      // Skip if it's already classified as past or today
      if (
        pastAppointmentIds.has(appt._id) ||
        todayAppointmentIds.has(appt._id)
      ) {
        return false;
      }

      // Convert to date objects for comparison
      const today = new Date();
      const todayDateOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      // Parse the appointment date
      const apptDate = new Date(appt.date);
      const apptDateOnly = new Date(
        apptDate.getFullYear(),
        apptDate.getMonth(),
        apptDate.getDate()
      );

      // Check if it's a future date (not today)
      const isFutureDate = apptDateOnly > todayDateOnly;

      // Debug logging
      console.log(`Appointment date check for ${appt.date}:`, {
        date: appt.date,
        parsedDate: apptDate.toISOString(),
        isFutureDate,
        shouldShowInUpcoming: isFutureDate,
      });

      return isFutureDate;
    } catch (error) {
      console.error("Error filtering upcoming appointment:", error);
      return false;
    }
  });
  console.log("Upcoming appointments after filter:", upcomingAppointments);

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* <h1 className="text-3xl font-bold mb-8">My Appointments</h1> */}

      {validAppointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600 mb-4">
            You don't have any appointments scheduled.
          </p>
          <Link
            to="/doctors"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Find a Doctor
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today's Appointments */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {todayAppointments.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {todayAppointments.map((appointment) => (
                    <li key={appointment._id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-lg">
                            Dr. {appointment.doctorId.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctorId.specialization}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Time:</span>{" "}
                              {appointment.time}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Type:</span>{" "}
                              {appointment.type}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Status:</span>{" "}
                              <span
                                className={`
                                  ${
                                    appointment.status === "Pending"
                                      ? "text-yellow-600"
                                      : appointment.status === "Accepted"
                                      ? "text-green-600"
                                      : appointment.status === "Completed"
                                      ? "text-blue-600"
                                      : "text-red-600"
                                  }
                                `}
                              >
                                {appointment.status}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          {appointment.type === "Online" &&
                            (appointment.status === "Accepted" ||
                              appointment.status === "Rescheduled") &&
                            isTimeToJoinCall(
                              appointment.date,
                              appointment.time
                            ) && (
                              <Link
                                to={`/video-consultation/${appointment._id}`}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
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
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-gray-500">
                  No appointments scheduled for today.
                </p>
              )}
            </div>
          </section>

          {/* Upcoming Appointments */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Upcoming Appointments
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {upcomingAppointments.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {upcomingAppointments
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((appointment) => (
                      <li
                        key={appointment._id}
                        className="p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-lg">
                              Dr. {appointment.doctorId.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.doctorId.specialization}
                            </p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(appointment.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "numeric",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Time:</span>{" "}
                                {appointment.time}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Type:</span>{" "}
                                {appointment.type}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Status:</span>{" "}
                                <span
                                  className={`
                                  ${
                                    appointment.status === "Pending"
                                      ? "text-yellow-600"
                                      : appointment.status === "Accepted"
                                      ? "text-green-600"
                                      : appointment.status === "Completed"
                                      ? "text-blue-600"
                                      : "text-red-600"
                                  }
                                `}
                                >
                                  {appointment.status}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2">
                            {appointment.type === "Online" &&
                              (appointment.status === "Accepted" ||
                                appointment.status === "Rescheduled") &&
                              isTimeToJoinCall(
                                appointment.date,
                                appointment.time
                              ) && (
                                <Link
                                  to={`/video-consultation/${appointment._id}`}
                                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
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
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="p-4 text-gray-500">
                  No upcoming appointments scheduled.
                </p>
              )}
            </div>
          </section>

          {/* Past Appointments */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {pastAppointments.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {pastAppointments
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
                    .map((appointment) => (
                      <li
                        key={appointment._id}
                        className="p-4 hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-lg">
                            Dr. {appointment.doctorId.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctorId.specialization}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Date:</span>{" "}
                              {new Date(appointment.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                }
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Time:</span>{" "}
                              {appointment.time}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Type:</span>{" "}
                              {appointment.type}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Status:</span>{" "}
                              <span className="text-gray-600">
                                {appointment.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="p-4 text-gray-500">No past appointments found.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
