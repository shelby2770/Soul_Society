import { Button } from "./button";
import { useToast } from "../../contexts/ToastContext";

const ToastTest = () => {
  const { success, error, info } = useToast();

  const handleTestSuccessToast = () => {
    success("Success toast is working!");
  };

  const handleTestErrorToast = () => {
    error("Error toast is working!");
  };

  const handleTestInfoToast = () => {
    info("Info toast is working!");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button
        onClick={handleTestSuccessToast}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
      >
        Test Success Toast
      </Button>
      <Button
        onClick={handleTestErrorToast}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
      >
        Test Error Toast
      </Button>
      <Button
        onClick={handleTestInfoToast}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Test Info Toast
      </Button>
    </div>
  );
};

export default ToastTest;
