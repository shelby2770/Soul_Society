// src/components/Survey.jsx
import React, { useState } from "react";
import questions from "../public/questions"; // Import questions

const Survey = ({ setSurveyScore }) => {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (index, score) => {
    const newAnswers = [...answers];
    newAnswers[index] = score;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (answers.includes(null)) {
      alert("Please answer all questions before submitting!");
      return;
    }
    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    setSurveyScore(totalScore);
    setSubmitted(true);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-2xl font-bold mb-4">Mental Health Survey</h2>
      {submitted ? (
        <div>
          <h3 className="text-green-600 text-xl font-semibold">Thank you for completing the survey!</h3>
        </div>
      ) : (
        <form className="space-y-4">
          {questions.map((q, index) => (
            <div key={index}>
              <p className="font-semibold">{q.question}</p>
              {q.options.map((option, i) => (
                <label key={i} className="block">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={q.scores[i]}
                    onChange={() => handleAnswerChange(index, q.scores[i])}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Submit Survey
          </button>
        </form>
      )}
    </div>
  );
};

export default Survey;
