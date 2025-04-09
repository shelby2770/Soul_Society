import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useState } from "react";
import LoginModal from "../modals/LoginModal";

const Navbar = () => {
  const user = null; // This should come from your auth context
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isAuthenticated = false; // Replace with your auth context

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    console.log("Sign out clicked");
  };

  const handleDoctorsClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginModal(true);
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
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className={`text-sm transition-colors h-10 leading-loose ${
                      location.pathname === "/dashboard"
                        ? "text-blue-700 font-medium"
                        : "hover:text-blue-600"
                    }`}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="text-sm hover:text-blue-500 transition-colors h-10 leading-loose"
                >
                  Log out
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

      {/* Mobile menu */}
      <div
        className={`md:hidden ${
          isMenuOpen ? "block" : "hidden"
        } bg-white shadow-lg`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/doctors"
            className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
            onClick={(e) => {
              setIsMenuOpen(false);
              handleDoctorsClick(e);
            }}
          >
            Find Doctors
          </Link>
          <Link
            to="/about"
            className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/contact"
            className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex flex-col space-y-2 px-3">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full rounded-full bg-blue-500 text-white hover:bg-blue-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default Navbar;
