import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import VideoCall from "../components/VideoCall";
import axios from "axios";

const VideoConsultation = () => {
  const { appointmentId } = useParams();
  const { user, userData } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId || !user || !userData) {
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/appointments/${appointmentId}`
        );

        if (response.data.success) {
          const appt = response.data.appointment;
          setAppointment(appt);

          // Check if the current user is the doctor or patient
          // Convert IDs to strings for proper comparison
          const doctorId = appt.doctorId._id
            ? String(appt.doctorId._id)
            : String(appt.doctorId);
          const patientId = appt.patientId._id
            ? String(appt.patientId._id)
            : String(appt.patientId);
          const currentUserId = String(userData._id);

          const doctorEmail = appt.doctorId.email || "";
          const patientEmail = appt.patientId.email || "";
          const currentUserEmail = userData.email || "";

          // Debug logging
          console.log("Authorization check for video consultation:");
          console.log("Current User ID:", currentUserId);
          console.log("Doctor ID:", doctorId);
          console.log("Patient ID:", patientId);
          console.log("Current User Email:", currentUserEmail);
          console.log("Doctor Email:", doctorEmail);
          console.log("Patient Email:", patientEmail);

          if (currentUserId === doctorId || currentUserEmail === doctorEmail) {
            console.log("User authorized as doctor");
            setIsDoctor(true);
            setRemoteUser(appt.patientId);
          } else if (
            currentUserId === patientId ||
            currentUserEmail === patientEmail
          ) {
            console.log("User authorized as patient");
            setIsDoctor(false);
            setRemoteUser(appt.doctorId);
          } else {
            // User is neither doctor nor patient for this appointment
            console.log(
              "Authorization failed: User is neither the doctor nor patient for this appointment"
            );
            showError("You are not authorized to join this consultation");
            navigate("/");
            return;
          }

          // Check if appointment is Online type
          if (appt.type !== "Online") {
            showError("This is not an online consultation appointment");
            navigate("/");
            return;
          }

          // Check if it's the right time to join the call
          const canJoinCall = isTimeToJoinCall(appt.date, appt.time);
          if (!canJoinCall) {
            showError(
              "You can only join the video call within 20 minutes of the scheduled appointment time"
            );
            navigate("/appointments");
            return;
          }
        } else {
          showError("Error loading appointment details");
          navigate("/");
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
        showError("Could not load appointment details");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId, user, userData, API_URL, navigate, showError]);

  // Check if it's time to join the video call (20 minutes before appointment time)
  const isTimeToJoinCall = (date, time) => {
    try {
      const now = new Date();
      const apptDate = new Date(date);

      // Check if it's the same day
      const isSameDay =
        now.getDate() === apptDate.getDate() &&
        now.getMonth() === apptDate.getMonth() &&
        now.getFullYear() === apptDate.getFullYear();

      if (!isSameDay) {
        console.log("Cannot Join Video Call: not the same day");
        return false;
      }

      // Parse appointment time
      const [hours, minutes] = time.split(":").map(Number);
      const appointmentTime = new Date();
      appointmentTime.setHours(hours, minutes, 0);

      // Calculate time difference in minutes
      const diffInMinutes = (appointmentTime - now) / (1000 * 60);

      // Allow joining 20 minutes before the appointment time and until 30 minutes after
      const canJoin = diffInMinutes <= 20 && diffInMinutes >= -30;

      console.log(
        `Join Video Call time check: ${diffInMinutes.toFixed(
          1
        )} minutes until appointment, canJoin: ${canJoin}`
      );

      return canJoin;
    } catch (error) {
      console.error("Error in isTimeToJoinCall:", error);
      return false;
    }
  };

  const handleEndCall = () => {
    success("Video consultation ended");

    // Redirect based on user type
    if (isDoctor) {
      navigate("/doctor-dashboard");
    } else {
      navigate("/appointments");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!appointment || !remoteUser) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Appointment Not Found</h1>
        <p className="mb-6">
          Sorry, we couldn't find the appointment you're looking for.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Video Consultation</h1>
        <p className="text-gray-600">
          {isDoctor
            ? `Consulting with ${remoteUser.name}`
            : `Consultation with Dr. ${remoteUser.name}`}
        </p>
        <p className="text-sm text-gray-500">
          Appointment: {new Date(appointment.date).toLocaleDateString()} at{" "}
          {appointment.time}
        </p>
      </div>

      <div
        className="bg-white rounded-lg shadow-md overflow-hidden"
        style={{ height: "70vh" }}
      >
        <VideoCall
          appointmentId={appointmentId}
          isDoctor={isDoctor}
          remoteName={remoteUser.name}
          onEndCall={handleEndCall}
        />
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          Video and audio are only shared between participants and are not
          recorded or stored. For the best experience, use a modern browser and
          ensure your camera and microphone permissions are granted.
        </p>
      </div>
    </div>
  );
};

export default VideoConsultation;
