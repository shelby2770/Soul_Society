import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import LoginModal from "../modals/LoginModal";
import { useAuth } from "../../contexts/AuthContext";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Notifications from "../Notifications";

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, userData, signOut, fetchUserData } = useAuth();

  // console.log(user, user.email);
  const navigate = useNavigate();

  // List of public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/", "/about", "/contact"];

  useEffect(() => {
    // Only redirect to login if user is not authenticated and trying to access a protected route
    if (!user && !publicRoutes.includes(location.pathname)) {
      navigate("/login");
      return;
    }

    const loadInitialData = async () => {
      console.log(userData);
      try {
        if (user?.email) {
          await fetchUserData(user.email);
          // Redirect users to their respective dashboards after login
          if (location.pathname === "/") {
            if (userData?.type === "doctor") {
              navigate("/doctor-dashboard");
            } else if (userData?.type === "patient") {
              navigate("/patient-dashboard");
            }
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user, navigate, userData?.type, location.pathname]);

  // Debug output for auth state changes
  useEffect(() => {
    console.log(
      "Auth state changed in Navbar:",
      user ? "User exists" : "No user"
    );
  }, [user]);

  const handleDoctorsClick = (e) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log("Sign out successful");
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest(".profile-menu-container")) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-white bg-opacity-95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold leading-loose tracking-wide">
                Soul Society
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              to={
                user && userData?.type === "doctor"
                  ? "/doctor-dashboard"
                  : user && userData?.type === "patient"
                  ? "/patient-dashboard"
                  : "/"
              }
              className={`text-sm transition-colors h-10 leading-loose ${
                location.pathname === "/" ||
                (userData?.type === "doctor" &&
                  location.pathname === "/doctor-dashboard") ||
                (userData?.type === "patient" &&
                  location.pathname === "/patient-dashboard")
                  ? "text-blue-700 font-medium"
                  : "text-gray-900 hover:text-blue-600"
              }`}
            >
              {user && userData?.type === "doctor"
                ? "Doctor Dashboard"
                : user && userData?.type === "patient"
                ? "Patient Dashboard"
                : "Home"}
            </Link>
            <Link
              to="/about"
              className={`text-sm transition-colors h-10 leading-loose ${
                location.pathname === "/about"
                  ? "text-blue-700 font-medium"
                  : "text-gray-900 hover:text-blue-600"
              }`}
            >
              About
            </Link>
            {user && userData?.type === "doctor" ? null : (
              <Link
                to="/doctors"
                className={`text-sm transition-colors h-10 leading-loose ${
                  location.pathname === "/doctors"
                    ? "text-blue-700 font-medium"
                    : "text-gray-900 hover:text-blue-600"
                }`}
                onClick={handleDoctorsClick}
              >
                Find a Doctor
              </Link>
            )}
            {user &&
              (userData?.type === "patient" || userData?.type === "doctor") && (
                <Link
                  to="/chat"
                  className={`text-sm transition-colors h-10 leading-loose ${
                    location.pathname === "/chat"
                      ? "text-blue-700 font-medium"
                      : "text-gray-900 hover:text-blue-600"
                  }`}
                >
                  Chat
                </Link>
              )}
            {user && userData?.type === "patient" && (
              <Link
                to="/appointments"
                className={`text-sm transition-colors h-10 leading-loose ${
                  location.pathname === "/appointments"
                    ? "text-blue-700 font-medium"
                    : "text-gray-900 hover:text-blue-600"
                }`}
              >
                My Appointments
              </Link>
            )}
            <Link
              to="/contact"
              className={`text-sm transition-colors h-10 leading-loose ${
                location.pathname === "/contact"
                  ? "text-blue-700 font-medium"
                  : "text-gray-900 hover:text-blue-600"
              }`}
            >
              Contact
            </Link>
            {/* {user && userData?.type === "doctor" && (
              <Link
                to="/doctor-dashboard"
                className={`text-sm transition-colors h-10 leading-loose ${
                  location.pathname === "/doctor-dashboard"
                    ? "text-blue-700 font-medium"
                    : "text-gray-900 hover:text-blue-600"
                }`}
              >
                Doctor Dashboard
              </Link>
            )} */}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <Notifications />

                {/* Profile Icon with Dropdown */}
                <div className="relative profile-menu-container">
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none"
                    aria-label="Profile menu"
                  >
                    <FiUser className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Profile
                      </Link>
                      {userData?.type === "patient" && (
                        <Link
                          to="/chat"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Chat
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>

                {/* Sign Out Button */}
                <Button
                  onClick={handleSignOut}
                  className="rounded-full text-sm px-6 h-10 leading-loose transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    className={`rounded-full text-sm px-6 h-10 leading-loose transition-colors ${
                      location.pathname === "/login"
                        ? "bg-blue-700 text-white hover:bg-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    className={`rounded-full text-sm px-6 h-10 leading-loose transition-colors ${
                      location.pathname === "/signup"
                        ? "bg-blue-700 text-white hover:bg-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          <div className="pt-16 pb-3 space-y-1">
            <div className="flex items-center justify-between px-4">
              <Link to="/" className="font-medium text-xl">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold">
                  Soul Society
                </span>
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Close menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to={
                  user && userData?.type === "doctor"
                    ? "/doctor-dashboard"
                    : user && userData?.type === "patient"
                    ? "/patient-dashboard"
                    : "/"
                }
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === "/" ||
                  (userData?.type === "doctor" &&
                    location.pathname === "/doctor-dashboard") ||
                  (userData?.type === "patient" &&
                    location.pathname === "/patient-dashboard")
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {user && userData?.type === "doctor"
                  ? "Doctor Dashboard"
                  : user && userData?.type === "patient"
                  ? "Patient Dashboard"
                  : "Home"}
              </Link>
              <Link
                to="/about"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === "/about"
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              {user && userData?.type === "doctor" ? null : (
                <Link
                  to="/doctors"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === "/doctors"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={(e) => {
                    handleDoctorsClick(e);
                    setIsMenuOpen(false);
                  }}
                >
                  Find a Doctor
                </Link>
              )}
              {user &&
                (userData?.type === "patient" ||
                  userData?.type === "doctor") && (
                  <Link
                    to="/chat"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === "/chat"
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Chat
                  </Link>
                )}
              {user && userData?.type === "patient" && (
                <Link
                  to="/appointments"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === "/appointments"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Appointments
                </Link>
              )}
              <Link
                to="/contact"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === "/contact"
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {/* {user && userData?.type === "doctor" && (
                <Link
                  to="/doctor-dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === "/doctor-dashboard"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-900 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Doctor Dashboard
                </Link>
              )} */}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {user ? (
                <div className="space-y-1">
                  <div className="px-4 py-2">
                    <p className="text-base font-medium text-gray-800">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === "/profile"
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {userData?.type === "patient" && (
                    <Link
                      to="/chat"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === "/chat"
                          ? "text-blue-700 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Chat
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    to="/login"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === "/login"
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === "/signup"
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default Navbar;
