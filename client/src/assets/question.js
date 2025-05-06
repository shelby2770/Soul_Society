// Mental Health Assessment Questions Data
const questions = [
  {
    question: "How often do you feel overwhelmed by your responsibilities?",
    options: ["Rarely", "Sometimes", "Often", "Always", "Every day"],
    scores: [1, 2, 3, 4, 5],
    category: "stress",
  },
  {
    question: "Do you find time to relax or unwind during the day?",
    options: ["Always", "Often", "Sometimes", "Rarely", "Never"],
    scores: [1, 2, 3, 4, 5],
    category: "self-care",
  },
  {
    question: "How would you rate your energy levels on a typical day?",
    options: ["Very high", "High", "Moderate", "Low", "Very low"],
    scores: [1, 2, 3, 4, 5],
    category: "physical",
  },
  {
    question: "Do you experience trouble concentrating or staying focused?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    scores: [1, 2, 3, 4, 5],
    category: "cognitive",
  },
  {
    question: "How often do you feel anxious or worried about your life?",
    options: [
      "Rarely",
      "Sometimes",
      "Often",
      "Almost all the time",
      "Constantly",
    ],
    scores: [1, 2, 3, 4, 5],
    category: "anxiety",
  },
  {
    question: "Are you able to maintain a balanced diet and eat regularly?",
    options: ["Always", "Often", "Sometimes", "Rarely", "Never"],
    scores: [1, 2, 3, 4, 5],
    category: "physical",
  },
  {
    question:
      "Do you feel supported by friends or family when you're stressed?",
    options: ["Always", "Often", "Sometimes", "Rarely", "Never"],
    scores: [1, 2, 3, 4, 5],
    category: "social",
  },
  {
    question: "How often do you have trouble sleeping at night?",
    options: [
      "Rarely",
      "Sometimes",
      "Often",
      "Almost all the time",
      "Every night",
    ],
    scores: [1, 2, 3, 4, 5],
    category: "physical",
  },
  {
    question: "Do you feel confident in managing your time effectively?",
    options: ["Always", "Often", "Sometimes", "Rarely", "Never"],
    scores: [1, 2, 3, 4, 5],
    category: "self-management",
  },
  {
    question: "How often do you engage in activities you enjoy?",
    options: [
      "Daily",
      "Several times a week",
      "Weekly",
      "Monthly",
      "Rarely or never",
    ],
    scores: [1, 2, 3, 4, 5],
    category: "self-care",
  },
  {
    question: "Do you ever feel down, depressed, or hopeless?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Daily"],
    scores: [1, 2, 3, 4, 5],
    category: "mood",
  },
  {
    question:
      "Have you had thoughts that you would be better off dead or of hurting yourself?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Daily"],
    scores: [1, 4, 7, 9, 10], // Higher weights for suicidal thoughts
    category: "crisis",
  },
  {
    question: "How often do you feel irritable or angry?",
    options: ["Rarely", "Sometimes", "Often", "Most days", "Daily"],
    scores: [1, 2, 3, 4, 5],
    category: "mood",
  },
  {
    question: "Do you have difficulty controlling worry?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    scores: [1, 2, 3, 4, 5],
    category: "anxiety",
  },
  {
    question:
      "Do you experience panic attacks (sudden feelings of intense fear or anxiety)?",
    options: ["Never", "Once or twice", "Monthly", "Weekly", "Daily"],
    scores: [1, 2, 3, 4, 5],
    category: "anxiety",
  },
];

export default questions;
