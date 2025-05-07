import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useToast } from "../contexts/ToastContext";
import { auth } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import { API_URL } from "../utils/api";

const SignUp = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [userType, setUserType] = useState("patient");

  // Patient states
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [patientConfirmPassword, setPatientConfirmPassword] = useState("");

  // Doctor states
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [doctorConfirmPassword, setDoctorConfirmPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [cvFileName, setCvFileName] = useState("");

  // Common states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Separate password states for patient and doctor
  const [patientPasswordStrength, setPatientPasswordStrength] = useState("");
  const [doctorPasswordStrength, setDoctorPasswordStrength] = useState("");
  const [patientPasswordError, setPatientPasswordError] = useState("");
  const [doctorPasswordError, setDoctorPasswordError] = useState("");

  // Add state for password visibility (only for main password)
  const [showPassword, setShowPassword] = useState(false);

  // Get current values based on user type
  const currentName = userType === "patient" ? patientName : doctorName;
  const currentEmail = userType === "patient" ? patientEmail : doctorEmail;
  const currentPassword =
    userType === "patient" ? patientPassword : doctorPassword;
  const currentConfirmPassword =
    userType === "patient" ? patientConfirmPassword : doctorConfirmPassword;

  // Get current password states based on user type
  const passwordStrength =
    userType === "patient" ? patientPasswordStrength : doctorPasswordStrength;
  const passwordError =
    userType === "patient" ? patientPasswordError : doctorPasswordError;

  // Set current values based on user type
  const setCurrentName = (value) => {
    userType === "patient" ? setPatientName(value) : setDoctorName(value);
  };
  const setCurrentEmail = (value) => {
    userType === "patient" ? setPatientEmail(value) : setDoctorEmail(value);
  };
  const setCurrentPassword = (value) => {
    if (userType === "patient") {
      setPatientPassword(value);
      checkPasswordStrength(value, "patient");
      validatePassword(value, "patient");
    } else {
      setDoctorPassword(value);
      checkPasswordStrength(value, "doctor");
      validatePassword(value, "doctor");
    }
  };
  const setCurrentConfirmPassword = (value) => {
    userType === "patient"
      ? setPatientConfirmPassword(value)
      : setDoctorConfirmPassword(value);
  };

  const validatePassword = (password, type) => {
    const minLengthPatient = 8;
    const minLengthDoctor = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const setError =
      type === "patient" ? setPatientPasswordError : setDoctorPasswordError;
    const minLength = type === "patient" ? minLengthPatient : minLengthDoctor;

    if (password.length < minLength) {
      setError(`Password must be at least ${minLength} characters long`);
      return false;
    }

    if (!hasUpperCase || !hasLowerCase) {
      setError("Password must contain both uppercase and lowercase letters");
      return false;
    }

    if (!hasNumbers) {
      setError("Password must contain at least one number");
      return false;
    }

    if (!hasSpecialChar) {
      setError("Password must contain at least one special character");
      return false;
    }

    setError("");
    return true;
  };

  const checkPasswordStrength = (password, type) => {
    const setStrength =
      type === "patient"
        ? setPatientPasswordStrength
        : setDoctorPasswordStrength;

    if (password.length === 0) {
      setStrength("");
      return;
    }

    let strength = 0;
    if (password.length >= (type === "patient" ? 8 : 10)) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (type === "doctor" ? /.*\d.*\d.*/.test(password) : /\d/.test(password))
      strength += 1;
    if (
      type === "doctor"
        ? /.*[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>].*/.test(password)
        : /[!@#$%^&*(),.?":{}|<>]/.test(password)
    )
      strength += 1;

    if (strength < 2) setStrength("weak");
    else if (strength < 4) setStrength("medium");
    else setStrength("strong");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const currentPassword =
      userType === "patient" ? patientPassword : doctorPassword;
    const currentConfirmPassword =
      userType === "patient" ? patientConfirmPassword : doctorConfirmPassword;

    // Password validation
    if (!validatePassword(currentPassword, userType)) {
      return;
    }

    if (currentPassword !== currentConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Prepare the user data based on type
      const userData =
        userType === "patient"
          ? {
              type: "patient",
              name: patientName,
              email: patientEmail,
              password: patientPassword,
            }
          : {
              type: "doctor",
              name: doctorName,
              email: doctorEmail,
              password: doctorPassword,
              specialization: specialization,
              cvFileName: cvFileName || "none", // Provide default if not uploaded
            };

      // First create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      console.log("Firebase user created:", userCredential.user);

      // Then make API call to backend for signup
      const signupResponse = await axios.post(`${API_URL}/api/auth/signup`, {
        ...userData,
        firebaseId: userCredential.user.uid,
      });

      if (signupResponse.data.success) {
        // Store the token in localStorage
        localStorage.setItem("token", signupResponse.data.data.token);

        // Log success message
        console.log("✅ User created successfully:", {
          type: userType,
          name: userData.name,
          email: userData.email,
          ...(userType === "doctor" && {
            specialization: userData.specialization,
          }),
        });

        // Clear form and show success
        setError("");
        success("Account created successfully!");

        // Wait a moment to ensure Firebase auth state is updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Redirect to home page
        navigate("/");
      } else {
        throw new Error(
          signupResponse.data.message || "Failed to create account"
        );
      }
    } catch (err) {
      console.error("❌ Signup Error:", err);
      // If backend signup fails, delete the Firebase user if it was created
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.delete();
        }
      } catch (deleteError) {
        console.error("Error deleting Firebase user:", deleteError);
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create account. Please try again."
      );
      showError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCvFileName(file.name);
    }
  };

  const generateStrongPassword = () => {
    // Generate a random length between 12-20 characters
    const length = Math.floor(Math.random() * 9) + 12; // Random length between 12-20

    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";
    const specialChars = '!@#$%^&*(),.?":{}|<>';

    // Ensure at least one character of each type
    let password = "";
    password +=
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    password +=
      lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    password += numberChars[Math.floor(Math.random() * numberChars.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest with random characters
    const allChars =
      uppercaseChars + lowercaseChars + numberChars + specialChars;
    const remainingLength = length - password.length;

    for (let i = 0; i < remainingLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to randomize character positions
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setCurrentPassword(password);
    setCurrentConfirmPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-36 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your account
            </Link>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Type Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span
                className={`text-sm font-medium ${
                  userType === "patient" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                Patient
              </span>
              <button
                type="button"
                onClick={() =>
                  setUserType(userType === "patient" ? "doctor" : "patient")
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  userType === "doctor" ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userType === "doctor" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  userType === "doctor" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                Doctor
              </span>
            </div>

            <div>
              <label
                htmlFor={`${userType}-name`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id={`${userType}-name`}
                name={`${userType}-name`}
                autoComplete={userType === "patient" ? "name" : "off"}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:!text-black [&:-webkit-autofill]:!shadow-[0_0_0_100px_white_inset]"
                placeholder="Enter your full name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
              />
            </div>

            {userType === "doctor" && (
              <div>
                <label
                  htmlFor="specialization"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Specialization
                </label>
                <select
                  id="specialization"
                  name="specialization"
                  required={userType === "doctor"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value="" className="text-gray-500">
                    Select your specialization
                  </option>
                  <option value="psychiatrist">Psychiatrist</option>
                  <option value="psychologist">Psychologist</option>
                  <option value="counselor">Counselor</option>
                  <option value="therapist">Therapist</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor={`${userType}-email`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id={`${userType}-email`}
                name={`${userType}-email`}
                autoComplete={userType === "patient" ? "email" : "off"}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:!text-black [&:-webkit-autofill]:!shadow-[0_0_0_100px_white_inset]"
                placeholder="your.email@example.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor={`${userType}-password`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id={`${userType}-password`}
                  name={`${userType}-password`}
                  autoComplete={userType === "patient" ? "new-password" : "off"}
                  required
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:!text-black [&:-webkit-autofill]:!shadow-[0_0_0_100px_white_inset] ${
                    passwordError ? "border-red-500" : "border-gray-300"
                  } pr-24`}
                  placeholder="Create password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Generate Strong Password
                  </button>
                </div>
              </div>
              {passwordStrength && (
                <div className="mt-1">
                  <div className="flex items-center">
                    <div className="flex-1 h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          passwordStrength === "weak"
                            ? "w-1/3 bg-red-500"
                            : passwordStrength === "medium"
                            ? "w-2/3 bg-yellow-500"
                            : "w-full bg-green-500"
                        }`}
                      />
                    </div>
                    <span
                      className={`ml-2 text-xs ${
                        passwordStrength === "weak"
                          ? "text-red-500"
                          : passwordStrength === "medium"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {passwordStrength.charAt(0).toUpperCase() +
                        passwordStrength.slice(1)}
                    </span>
                  </div>
                </div>
              )}
              {passwordError && (
                <p className="mt-1 text-xs text-red-500">{passwordError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long and contain
                uppercase, lowercase, numbers, and special characters.
              </p>
            </div>

            <div>
              <label
                htmlFor={`${userType}-confirm-password`}
                className="block text-sm font-medium text-gray-700 mb-1 mt-4"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id={`${userType}-confirm-password`}
                  name={`${userType}-confirm-password`}
                  autoComplete={userType === "patient" ? "new-password" : "off"}
                  required
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:!text-black [&:-webkit-autofill]:!shadow-[0_0_0_100px_white_inset] ${
                    passwordError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Confirm your password"
                  value={currentConfirmPassword}
                  onChange={(e) => setCurrentConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {userType === "doctor" && (
              <div>
                <label
                  htmlFor="cv"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Upload CV/Certificates
                </label>
                <div className="mt-1 flex items-center">
                  <label
                    htmlFor="cv-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Choose File
                  </label>
                  <input
                    id="cv-upload"
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <span className="ml-3 text-sm text-gray-500">
                    {cvFileName || "No file chosen"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Upload your CV and relevant certificates (PDF, DOC, DOCX)
                </p>
              </div>
            )}

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <Link to="#" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
