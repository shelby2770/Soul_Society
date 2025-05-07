import mongoose from "mongoose";

const surveySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    answers: {
      type: Array,
      required: true,
    },
    categoryScores: {
      type: Object,
      required: true,
    },
    recommendation: {
      type: Object,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Survey", surveySchema);
