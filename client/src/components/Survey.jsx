import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import questions from "../assets/question"; // Ensure correct file path

const Survey = ({ setSurveyScore = () => {} }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [recommendation, setRecommendation] = useState("");

  const navigate = useNavigate(); // For redirecting to PatientDashboard

  const handleAnswerSelect = (score, index) => {
    setSelectedOption(index);
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = score;
    setAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setSelectedOption(null);
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setSelectedOption(null);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (answers.includes(null)) {
      alert("Please answer all questions before submitting!");
      return;
    }
    const totalScore = answers.reduce((sum, score) => sum + score, 0);

    // Set recommendation based on the score
    let recommendationMessage = "";
    if (totalScore > 35) {
      recommendationMessage = "You need a Psychiatrist.";
    } else if (totalScore > 30 && totalScore <= 35) {
      recommendationMessage = "You need a Psychologist.";
    } else if (totalScore > 25 && totalScore <= 30) {
      recommendationMessage = "You need a Counselor.";
    } else {
      recommendationMessage = "You need a Therapist.";
    }

    setRecommendation(recommendationMessage);
    setSurveyScore(totalScore); // Optional callback
    setSubmitted(true);
  };

  const goBackToDashboard = () => {
    navigate("/"); // Redirects to the PatientDashboard
  };

  return (
    <div className="h-screen bg-gradient-to-br from-green-200 via-blue-100 to-purple-200 text-gray-800 flex flex-col items-center justify-center">
      {submitted ? (
        <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-extrabold mb-4 text-blue-600">Survey Completed</h1>
          <p className="text-xl font-semibold text-gray-700 mb-6">
            {recommendation}
          </p>
          <button
            onClick={goBackToDashboard}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Go Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-600">Mental Health Survey</h1>
          <p className="text-center text-gray-500 text-base mb-3">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <div className="mb-5">
            <p className="text-xl font-semibold text-center mb-4">
              {questions[currentQuestion].question}
            </p>
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(questions[currentQuestion].scores[index], index)}
                className={`block w-full p-3 rounded-md text-left text-sm font-medium mb-2 border transition ${
                  selectedOption === index
                    ? "bg-green-300 text-gray-900 border-green-500"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Submit
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Survey;
