import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import About from "../pages/About";
import Contact from "../pages/Contact";
import NotFound from "../pages/NotFound";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import Doctors from "../pages/Doctors";
import Profile from "../pages/Profile";
import Chat from "../pages/Chat";
import DoctorDashboard from "../pages/DoctorDashboard";
import PatientDashboard from "../pages/PatientDashboard";
import PatientAppointments from "../pages/PatientAppointments";
import VideoConsultation from "../pages/VideoConsultation";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import Survey from "../pages/survey";

// Create a wrapper component that includes the AuthProvider
const AppWithProviders = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <Layout />
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppWithProviders />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "doctors",
        element: <Doctors />,
      },
      {
        path: "doctor-dashboard",
        element: <DoctorDashboard />,
      },
      {
        path: "patient-dashboard",
        element: <PatientDashboard />,
      },
      {
        path: "appointments",
        element: <PatientAppointments />,
      },
      {
        path: "video-consultation/:appointmentId",
        element: <VideoConsultation />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <SignUp />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "chat",
        element: <Chat />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
      {
        path: "survey",
        element: <Survey />,
      },
    ],
  },
]);
