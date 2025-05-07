import { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastContext";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const { success, error } = useToast();

  function signInWithGoogle() {
    console.log("first");
    return signInWithPopup(auth, googleProvider)
      .then((result) => {
        console.log("Google sign-in successful:", result);
        return result;
      })
      .catch((error) => {
        console.error("Google sign-in error:", error);
        throw error;
      });
  }
  console.log("second");

  // Fetch user data from MongoDB
  const fetchUserData = async (email) => {
    if (!user || !email) {
      console.log("No user or email found, skipping fetchUserData");
      return null;
    }

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://soul-society.onrender.com";
      console.log(
        "Fetching user data from:",
        `${API_URL}/api/users/email/${email}`
      );

      const response = await axios.get(`${API_URL}/api/users/email/${email}`);

      if (response.data && response.data.success) {
        console.log("User data fetched successfully:", response.data.user);
        setUserData(response.data.user);
        return response.data.user;
      }
      console.log("No user data in response:", response.data);
      return null;
    } catch (err) {
      console.error("Error fetching user data:", err);
      return null;
    }
  };

  useEffect(() => {
    console.log("Setting up auth listener in AuthContext");

    // Get the current user immediately
    const currentUser = auth.currentUser;
    console.log(
      "Current user on mount:",
      currentUser ? "User exists" : "No user"
    );
    if (currentUser) {
      setUser(currentUser);
    }

    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log(
        "Auth state changed in AuthContext:",
        currentUser ? "User logged in" : "No user"
      );
      setUser(currentUser);

      if (currentUser) {
        // Fetch user data from MongoDB when user is authenticated
        await fetchUserData(currentUser.email);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Remove token from localStorage
      localStorage.removeItem("token");
      success("Signed out successfully");
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      error("Failed to sign out");
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error("No user is currently signed in");
      }

      // Only allow name updates
      const safeUpdates = {
        name: updates.name,
      };

      // Update in Firebase Auth if name is being updated
      if (safeUpdates.name) {
        await updateProfile(user, { displayName: safeUpdates.name });
      }

      // Update in MongoDB
      const API_URL =
        import.meta.env.VITE_API_URL || "http://soul-society.onrender.com";
      console.log(
        "Updating user profile at:",
        `${API_URL}/api/users/email/${user.email}`
      );
      console.log("Update data:", safeUpdates);

      const response = await axios.put(
        `${API_URL}/api/users/email/${user.email}`,
        safeUpdates
      );

      if (response.data && response.data.success) {
        console.log("Profile updated successfully:", response.data.user);
        setUserData(response.data.user);
        success("Profile updated successfully");
        return true;
      }
      throw new Error("Failed to update profile in database");
    } catch (err) {
      console.error("Update profile error:", err);
      error(err.message || "Failed to update profile");
      return false;
    }
  };

  const updateUserEmail = async (newEmail, currentPassword) => {
    try {
      if (!user) {
        throw new Error("No user is currently signed in");
      }

      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);
      success("Email updated successfully");
      return true;
    } catch (err) {
      error("Failed to update email");
      console.error("Update email error:", err);
      return false;
    }
  };

  const updateUserPassword = async (newPassword, currentPassword) => {
    try {
      if (!user) {
        throw new Error("No user is currently signed in");
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      success("Password updated successfully");
      return true;
    } catch (err) {
      error("Failed to update password");
      console.error("Update password error:", err);
      return false;
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get JWT token from backend
      try {
        const response = await axios.post("/api/auth/login", {
          email,
          password,
        });
        if (
          response.data &&
          response.data.success &&
          response.data.data.token
        ) {
          // Store token in localStorage
          localStorage.setItem("token", response.data.data.token);
        }
      } catch (err) {
        console.error("Error getting JWT token:", err);
      }

      success("Logged in successfully");
      navigate("/");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Failed to log in";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled";
      }

      error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, name) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, { displayName: name });

      // Get JWT token from backend
      try {
        const response = await axios.post("/api/auth/signup", {
          email,
          password,
          name,
          type: "patient", // Default type
        });

        if (
          response.data &&
          response.data.success &&
          response.data.data.token
        ) {
          // Store token in localStorage
          localStorage.setItem("token", response.data.data.token);
        }
      } catch (err) {
        console.error("Error getting JWT token:", err);
      }

      success("Account created successfully");
      navigate("/");
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      }

      error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userData,
    loading,
    signOut,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    fetchUserData,
    signIn,
    signUp,
    signInWithGoogle,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
