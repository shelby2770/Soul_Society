import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import { API_URL } from "../utils/api";

const AssignedPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in or not a doctor
    if (!user || userData?.type !== "doctor") {
      navigate("/");
      return;
    }

    const fetchPatients = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/users/doctor/${user.email}/patients`
        );
        if (response.data && response.data.success) {
          setPatients(response.data.patients);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user, userData, navigate]);

  const handleViewDetails = (patientId) => {
    // TODO: Implement patient details view
    console.log("View details for patient:", patientId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-8">My Patients</h1>

      {patients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600 mb-4">
            You don't have any assigned patients yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div
              key={patient._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full">
                <span className="text-2xl text-blue-600">
                  {patient.name.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-center mb-2 text-gray-900">
                {patient.name}
              </h2>
              <p className="text-gray-600 text-center mb-4">{patient.email}</p>
              <div className="flex justify-center">
                <Button
                  onClick={() => handleViewDetails(patient._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedPatients;
