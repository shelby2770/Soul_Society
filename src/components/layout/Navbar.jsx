import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import LoginModal from "../modals/LoginModal";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-gray-700 transition-colors leading-loose ${
                location.pathname === "/"
                  ? "text-blue-700 font-medium"
                  : "hover:text-blue-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`text-gray-700 transition-colors leading-loose ${
                location.pathname === "/about"
                  ? "text-blue-700 font-medium"
                  : "hover:text-blue-600"
              }`}
            >
              About
            </Link>
            <Link
              to="/doctors"
              className={`text-gray-700 transition-colors leading-loose ${
                location.pathname === "/doctors"
                  ? "text-blue-700 font-medium"
                  : "hover:text-blue-600"
              }`}
              onClick={handleDoctorsClick}
            >
              Find Doctors
            </Link>
            <Link
              to="/contact"
              className={`text-gray-700 transition-colors leading-loose ${
                location.pathname === "/contact"
                  ? "text-blue-700 font-medium"
                  : "hover:text-blue-600"
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    className={`text-sm transition-colors h-10 leading-loose ${
                      location.pathname === "/profile"
                        ? "text-blue-700 font-medium"
                        : "hover:text-blue-600"
                    }`}
                  >
                    Profile
                  </Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="text-sm hover:text-blue-500 transition-colors h-10 leading-loose"
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
        </div>
      </header>

      {/* Mobile menu */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 focus:outline-none"
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          {!isMenuOpen ? (
            <svg
              className="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
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
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div className="relative flex flex-col h-full bg-white shadow-xl overflow-y-auto">
            <div className="px-4 pt-5 pb-6 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Link
                    to="/"
                    className="font-medium text-xl flex items-center"
                  >
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold leading-loose tracking-wide">
                      Soul Society
                    </span>
                  </Link>
                </div>
                <div className="-mr-2">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                  >
                    <span className="sr-only">Close menu</span>
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
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
                </div>
              </div>
              <div className="mt-5 space-y-1">
                <Link
                  to="/"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === "/"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === "/about"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/doctors"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === "/doctors"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setShowLoginModal(true);
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  Find Doctors
                </Link>
                <Link
                  to="/contact"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === "/contact"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                {user ? (
                  <div className="space-y-1">
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
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
};

export default Navbar;
