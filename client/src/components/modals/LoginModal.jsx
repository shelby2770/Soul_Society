import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Login Required
          </h3>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6">
            <p>Please log in to view our doctors and book appointments.</p>
          </div>
          <div className="space-y-4">
            <Button
              onClick={() => handleNavigation("/login")}
              className="w-full rounded-full bg-blue-500 hover:bg-blue-600 text-white py-2 text-lg"
            >
              Login
            </Button>
            <div className="text-sm text-gray-500">
              Don't have an account?{" "}
              <button
                onClick={() => handleNavigation("/signup")}
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
