import { Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import { useEffect, useState } from "react";
import { useToast } from "./contexts/ToastContext";
import ToastTest from "./components/ui/ToastTest";
import { Route } from "react-router-dom";
import Survey from "./components/pages/Survey";
import PatientDashboard from "./components/pages/PatientDashboard";

function App() {
  const { success } = useToast();

  // Test toast on component mount
  useEffect(() => {
    // success("Toast system is working!");
  }, [success]);

  const [surveyScore, setSurveyScore] = useState(() => {
    // Get the last survey score from localStorage when the app loads
    const savedScore = localStorage.getItem("lastSurveyScore");
    return savedScore ? parseInt(savedScore) : null;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ToastTest />
      <Route path="/survey" element={<Survey />} />
      <Route
        path="/"
        element={<PatientDashboard surveyScore={surveyScore} />}
      />
    </div>
  );
}

export default App;
