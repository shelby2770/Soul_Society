import express from "express";
import {
  createSurvey,
  getLatestSurvey,
} from "../controllers/surveyController.js";

const router = express.Router();

// POST /api/surveys - Create a new survey
router.post("/", createSurvey);

// GET /api/surveys/latest/:userId - Get the latest survey for a user
router.get("/latest/:userId", getLatestSurvey);

export default router;
