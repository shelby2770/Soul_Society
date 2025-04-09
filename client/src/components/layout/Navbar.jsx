import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";

const Navbar = () => {
  const user = null; // This should come from your auth context
  const location = useLocation();

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    console.log("Sign out clicked");
  };

  return (
    <header className="fixed top-0 z-50 w-full bg-white bg-opacity-95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto flex h-24 items-center justify-between px-4 sm:px-6 lg:px-8">
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
  );
};

export default Navbar;
