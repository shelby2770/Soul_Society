import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, userData, fetchUserData } = useAuth();
  // console.log(user, user.email);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (user.email) {
          await fetchUserData(user.email);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, navigate]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        console.log("Fetching doctors from:", `${API_URL}/api/users/doctors`);

        const response = await axios.get(`${API_URL}/api/users/doctors`);
        console.log("Doctors API response:", response.data);

        if (response.data && response.data.success) {
          console.log("Setting doctors:", response.data.doctors);
          setDoctors(response.data.doctors);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleBookAppointment = (doctorId) => {
    // TODO: Implement appointment booking functionality
    console.log("Book appointment with doctor:", doctorId);
  };

  // Debug logging for render conditions
  console.log("Render state:", {
    user,
    userType: userData?.type,
    doctorsCount: doctors.length,
    isLoading: loading,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* <h1 className="text-3xl font-bold mb-8">Find a Doctor</h1> */}

      {!user ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600 mb-4">
            Please log in to view doctors and book appointments.
          </p>
        </div>
      ) : userData?.type !== "patient" ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600 mb-4">
            Only patients can view doctors and book appointments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full">
                <span className="text-2xl text-blue-600">
                  {doctor.name.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-center mb-2 text-gray-900">
                {doctor.name}
              </h2>
              {doctor.specialization && (
                <p className="text-blue-600 text-center text-sm font-medium mb-2">
                  {doctor.specialization}
                </p>
              )}
              <p className="text-gray-600 text-center mb-4">{doctor.email}</p>
              <div className="flex justify-center">
                <Button
                  onClick={() => handleBookAppointment(doctor._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
                >
                  Book Appointment
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Doctors;
