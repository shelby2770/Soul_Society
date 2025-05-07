import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopupInstructions, setShowPopupInstructions] = useState(false);
  const { signInWithGoogle, signIn } = useAuth();

  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result) {
        success("Login successful!");
      } else {
        setError("Login failed. Please check your credentials.");
        showError("Login failed. Please check your credentials.");
      }
    } catch (error) {
      setError(error.message);
      showError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google: " + error.message);
    } finally {
      setLoading(false);
    }
    // setError("");
    // setLoading(true);
    // setShowPopupInstructions(false);

    // try {
    //   // Check if popups are blocked
    //   const popupTest = window.open("", "_blank", "width=1,height=1");
    //   if (!popupTest) {
    //     setShowPopupInstructions(true);
    //     throw new Error("popup-blocked");
    //   }
    //   popupTest.close();

    //   const result = await signInWithPopup(auth, googleProvider);
    //   if (result.user) {
    //     success("Login successful!");
    //     setTimeout(() => {
    //       navigate("/");
    //     }, 1000);
    //   }
    // } catch (error) {
    //   console.error("Google Sign-In Error Details:", {
    //     code: error.code,
    //     message: error.message,
    //   });

    //   let errorMessage = "Failed to sign in with Google";
    //   if (
    //     error.code === "auth/popup-blocked" ||
    //     error.message === "popup-blocked"
    //   ) {
    //     errorMessage =
    //       "Please enable popups for this site to sign in with Google.";
    //     setShowPopupInstructions(true);
    //   } else if (error.code === "auth/popup-closed-by-user") {
    //     errorMessage = "Sign-in was cancelled. Please try again.";
    //   } else if (error.code === "auth/configuration-not-found") {
    //     errorMessage =
    //       "Google Sign-In is not properly configured. Please contact support.";
    //   }

    //   setError(errorMessage);
    //   showError(errorMessage);
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-36 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {showPopupInstructions && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              <p className="font-medium">How to enable popups:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>
                  Click the popup blocker icon in your browser's address bar
                </li>
                <li>Select "Always allow popups from this site"</li>
                <li>Refresh the page and try signing in again</li>
              </ol>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg rounded-full transition-colors"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 text-lg rounded-full hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <FcGoogle className="w-5 h-5" />
                {loading ? "Signing in..." : "Sign in with Google"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
