import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastContext";

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
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    console.log("Setting up auth listener in AuthContext");
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log(
        "Auth state changed in AuthContext:",
        currentUser ? "User logged in" : "No user"
      );
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
      success("Signed out successfully");
      navigate("/");
    } catch (err) {
      error("Failed to sign out");
      console.error("Sign out error:", err);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
