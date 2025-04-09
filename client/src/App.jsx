import { Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import { useEffect } from "react";
import { useToast } from "./contexts/ToastContext";
import ToastTest from "./components/ui/ToastTest";

function App() {
  const { success } = useToast();

  // Test toast on component mount
  useEffect(() => {
    // success("Toast system is working!");
  }, [success]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ToastTest />
    </div>
  );
}

export default App;
