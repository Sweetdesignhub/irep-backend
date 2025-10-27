
import { Router } from "express";

import { sendEmailNotification } from "../utils/email.util.js";
import { textToSpeech, speechToText, scrapeUrlDetails, textProcessingController } from "../controllers/text.controller.js";
import { uploadVoice } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/send-email", sendEmailNotification);
router.post("/text-to-speech", textToSpeech);
router.post("/speech-to-text", uploadVoice.single("voiceFile"), speechToText);
router.post("/scrape", scrapeUrlDetails);
router.post("/process-text", textProcessingController);

export default router;
