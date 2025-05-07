import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import questions from "../assets/question";

const Survey = () => {
  const { user, userData } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [surveyResult, setSurveyResult] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleAnswerSelect = (score, index) => {
    setSelectedOption(index);
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = {
      score,
      category: questions[currentQuestion].category,
      question: questions[currentQuestion].question,
      answer: questions[currentQuestion].options[index],
    };
    setAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (answers[currentQuestion] === null) {
      alert("Please select an answer before proceeding.");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setSelectedOption(null);
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setSelectedOption(
        answers[currentQuestion - 1]
          ? questions[currentQuestion - 1].options.indexOf(
              answers[currentQuestion - 1].answer
            )
          : null
      );
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateCategoryScores = (answersArray) => {
    const categories = {};

    // Collect scores by category
    answersArray.forEach((answer) => {
      if (answer && answer.category) {
        if (!categories[answer.category]) {
          categories[answer.category] = {
            scores: [],
            total: 0,
            average: 0,
            count: 0,
          };
        }
        categories[answer.category].scores.push(answer.score);
        categories[answer.category].total += answer.score;
        categories[answer.category].count += 1;
      }
    });

    // Calculate averages
    Object.keys(categories).forEach((category) => {
      categories[category].average =
        categories[category].total / categories[category].count;
    });

    return categories;
  };

  const getRecommendation = (totalScore, categoryScores) => {
    // Check for crisis indicators first
    if (categoryScores.crisis && categoryScores.crisis.average > 3) {
      return {
        text: "Please seek immediate help from a Psychiatrist.",
        type: "psychiatrist",
        urgency: "immediate",
        score: totalScore,
        severityLevel: "severe",
      };
    }

    // Check anxiety levels
    const hasHighAnxiety =
      categoryScores.anxiety && categoryScores.anxiety.average > 3.5;

    // Check mood indicators
    const hasDepression =
      categoryScores.mood && categoryScores.mood.average > 3.5;

    // Determine recommendation based on total score and specific indicators
    if (totalScore > 50 || (hasHighAnxiety && hasDepression)) {
      return {
        text: "You need a Psychiatrist for professional evaluation and possible medication.",
        type: "psychiatrist",
        urgency: "high",
        score: totalScore,
        severityLevel: "moderate-severe",
      };
    } else if (totalScore > 40 || hasDepression) {
      return {
        text: "You need a Psychologist for therapy and counseling.",
        type: "psychologist",
        urgency: "medium",
        score: totalScore,
        severityLevel: "moderate",
      };
    } else if (totalScore > 30 || hasHighAnxiety) {
      return {
        text: "You would benefit from seeing a Counselor.",
        type: "counselor",
        urgency: "low",
        score: totalScore,
        severityLevel: "mild-moderate",
      };
    } else if (totalScore > 20) {
      return {
        text: "You may benefit from speaking with a Therapist.",
        type: "therapist",
        urgency: "low",
        score: totalScore,
        severityLevel: "mild",
      };
    } else {
      return {
        text: "Your mental health appears to be in good condition. Continue with self-care practices.",
        type: "none",
        urgency: "none",
        score: totalScore,
        severityLevel: "normal",
      };
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if all questions are answered
      if (answers.includes(null)) {
        alert("Please answer all questions before submitting!");
        setLoading(false);
        return;
      }

      // Calculate total score
      const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);

      // Calculate category scores
      const categoryScores = calculateCategoryScores(answers);

      // Get recommendation based on scores
      const result = getRecommendation(totalScore, categoryScores);

      // Set recommendation message
      setRecommendation(result.text);

      // Prepare survey result
      const surveyData = {
        userId: userData?._id || user?.uid,
        score: totalScore,
        answers: answers,
        categoryScores,
        recommendation: result,
        completedAt: new Date().toISOString(),
      };

      // Save to state
      setSurveyResult(surveyData);

      // Save to backend if user is authenticated
      if (userData?._id || user?.uid) {
        try {
          const response = await axios.post(
            `${API_URL}/api/surveys`,
            surveyData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          console.log("Survey saved to backend:", response.data);
        } catch (err) {
          console.error("Error saving survey:", err);
          // Continue even if saving to backend fails
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Error processing survey:", err);
      setError("There was a problem processing your survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBackToDashboard = () => {
    // If we have survey results, pass the score to dashboard
    if (surveyResult) {
      localStorage.setItem("lastSurveyScore", surveyResult.score);
      localStorage.setItem(
        "lastSurveyRecommendation",
        JSON.stringify(surveyResult.recommendation)
      );
    }
    navigate("/");
  };

  // Progress percentage calculation
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {submitted ? (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
              Survey Completed
            </h1>

            {error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            ) : surveyResult ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-100 rounded-full mb-4">
                    <span className="text-3xl font-bold text-indigo-700">
                      {surveyResult.score}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Your Mental Health Score
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Severity: {surveyResult.recommendation.severityLevel}
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <h3 className="font-semibold text-indigo-800 mb-2">
                    Recommendation:
                  </h3>
                  <p className="text-gray-700">{recommendation}</p>
                  {surveyResult.recommendation.urgency === "immediate" && (
                    <p className="text-red-600 font-semibold mt-2">
                      Please seek help immediately. This is an urgent matter.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Category Breakdown:
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(surveyResult.categoryScores).map(
                      ([category, data]) => (
                        <div key={category}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {category}
                            </span>
                            <span className="text-sm font-medium text-indigo-600">
                              {data.average.toFixed(1)} / 5
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                data.average < 2.0
                                  ? "bg-green-500"
                                  : data.average < 3.5
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${(data.average / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Next Steps:
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Your results have been saved to your profile</li>
                    <li>Recommended doctors are available on your dashboard</li>
                    <li>
                      You can book an appointment with a specialist from your
                      dashboard
                    </li>
                    {surveyResult.recommendation.urgency !== "none" && (
                      <li>
                        Consider speaking to a mental health professional soon
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-600">
                Processing your results...
              </p>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={goBackToDashboard}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
              Mental Health Assessment
            </h1>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span>{progressPercentage.toFixed(0)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleAnswerSelect(
                        questions[currentQuestion].scores[index],
                        index
                      )
                    }
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedOption === index
                        ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading || answers[currentQuestion] === null}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Processing...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={answers[currentQuestion] === null}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Survey;
