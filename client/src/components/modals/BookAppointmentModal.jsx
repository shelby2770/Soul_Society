import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const BookAppointmentModal = ({ isOpen, onClose, doctor }) => {
  const { user, userData } = useAuth();
  const { success, error: showError } = useToast();
  const [appointmentType, setAppointmentType] = useState("Online");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://soul-society.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user || !userData) {
        throw new Error("User information not available");
      }

      const response = await axios.post(`${API_URL}/api/appointments/book`, {
        doctorId: doctor._id,
        patientId: userData._id,
        patientEmail: user.email,
        type: appointmentType,
        date: appointmentDate,
        time: appointmentTime,
      });

      if (response.data.success) {
        success("Appointment booked successfully!");
        onClose();
        setAppointmentType("Online");
        setAppointmentDate("");
        setAppointmentTime("");
      }
    } catch (err) {
      console.error("Booking error:", err);
      showError(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-semibold mb-4">Book Appointment</h2>
        <p className="mb-4">
          <span className="font-medium">Doctor:</span> {doctor.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Type
            </label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
