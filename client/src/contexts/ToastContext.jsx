import { createContext, useContext, useState, useEffect } from "react";
import { Toaster, toast as hotToast } from "react-hot-toast";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Also use react-hot-toast for immediate feedback
    if (type === "success") {
      hotToast.success(message);
    } else if (type === "error") {
      hotToast.error(message);
    } else {
      hotToast(message);
    }

    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const success = (message) => addToast(message, "success");
  const error = (message) => addToast(message, "error");
  const info = (message) => addToast(message, "info");

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerStyle={{ top: 40 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "8px",
            padding: "12px 16px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
          success: {
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
};

export default ToastContext;
