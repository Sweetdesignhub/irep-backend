import axios from "axios";
import dotenv from "dotenv";
import { Readable } from "stream";
import cloudinary from "../config/cloudinaryConfig.js";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { getJson } from "serpapi";
import {
    combineText,
    textFormatter,
    findAndReplace,
    splitText,
    chunkText,
} from "../services/text.service.js"

dotenv.config();


// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export const speechToText = async (req, res) => {
    try {
        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: "No voice file uploaded" });
        }

        console.log("🎤 File uploaded to Cloudinary:", req.file.path);
        console.log("🔑 OpenAI API Key:", process.env.WHISPER_SPEECH_API_KEY);

        // Download the file from Cloudinary
        const fileUrl = req.file.path;
        const fileResponse = await axios.get(fileUrl, { responseType: "arraybuffer" });

        // Save the file temporarily
        const tempFilePath = path.join("/tmp", `temp_audio.mp3`);
        fs.writeFileSync(tempFilePath, fileResponse.data);
        console.log("📥 Audio file saved locally for processing...");

        // Prepare FormData
        const formData = new FormData();
        formData.append("file", fs.createReadStream(tempFilePath));
        formData.append("model", "whisper-1");
        formData.append("language", "en");

        // Whisper API Request
        const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
            headers: {
                "Authorization": `Bearer ${process.env.WHISPER_SPEECH_API_KEY}`,
                ...formData.getHeaders(),
            },
        });

        console.log("✅ Transcription completed:", response.data.text);

        // Cleanup temp file
        fs.unlinkSync(tempFilePath);

        // Send response
        res.status(200).json({
            message: "Speech-to-text conversion successful",
            text: response.data.text,
        });

    } catch (error) {
        console.error("❌ Error in Speech-to-Text:", error.message);
        res.status(500).json({ message: "Failed to convert speech to text", error: error.message });
    }
};

export const textToSpeech = async (req, res) => {
    try {
        const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = req.body;

        // Validate required field
        if (!text) {
            return res.status(400).json({ message: "Text is required" });
        }

        // API request options
        const options = {
            method: "POST",
            url: `${ELEVENLABS_API_URL}/${voiceId}`,
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            data: {
                text: text,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                },
            },
            responseType: "arraybuffer", // To handle binary data (MP3 file)
        };

        // Send request to ElevenLabs API
        const response = await axios(options);
        const audioBuffer = response.data; // MP3 binary data

        // Convert buffer to stream for Cloudinary upload
        const audioStream = Readable.from(audioBuffer);

        // Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "video", // Cloudinary treats audio as "video"
                    folder: "generated_voices", // Custom folder in Cloudinary
                    format: "mp3", // Ensure MP3 format
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Pipe stream to Cloudinary upload
            audioStream.pipe(uploadStream);
        });

        console.log("🎤 Text-to-speech conversion successful:", uploadResponse.secure_url);

        // Send success response
        res.status(200).json({
            message: "Text-to-speech conversion successful",
            cloudinaryUrl: uploadResponse.secure_url, // Cloudinary file URL
        });

    } catch (error) {
        console.error("❌ Error converting text to speech:", error.message);

        // Send error response
        res.status(500).json({ message: "Failed to convert text to speech", error: error.message });
    }
};

export const scrapeUrlDetails = (req, res) => {
    const { url } = req.body; // Get the URL from the request body

    if (!url) {
        return res.status(400).json({ error: "URL is required in the request body." });
    }

    getJson(
        {
            q: `site:${url}`, // Search for the specific URL
            hl: "en", // Language: English
            gl: "us", // Country: United States
            google_domain: "google.com", // Google domain to use
            api_key: "48227717e40546d7a04c8dba3834909f842789e86668a5dbd9587785ee970ff3", // Your SERP API key
        },
        (json) => {
            if (json.error) {
                // Handle API errors
                res.status(500).json({ error: json.error });
            } else if (json.organic_results && json.organic_results.length > 0) {

                // Extract the first result
                const firstResult = json.organic_results[0];
                console.log();
                res.status(200).json({
                    firstResult: firstResult,
                    title: firstResult.title,
                    link: firstResult.link,
                    snippet: firstResult.snippet,
                });
            } else {
                // Handle no results found
                res.status(404).json({ error: "No results found for the given URL." });
            }
        }
    );
};


export const textProcessingController = async (req, res) => {
    const { action, inputs, input, text, format, formatter, truncateLength, replacements, delimiter, splitOnNewline, chunkSize } = req.body;

    try {
        let result;

        switch (action) {
            case "combineText":
                if (!inputs || !format) {
                    throw new Error("Both 'inputs' and 'format' are required for combineText.");
                }
                result = combineText(inputs, format);
                break;

            case "textFormatter":
                console.log(value, formatter, truncateLength);
                if (!formatter || !value) {
                    throw new Error("Both 'formatter' and 'value' are required for textFormatter.");
                }
                result = textFormatter(value, formatter, truncateLength);
                break;

            case "findAndReplace":
                if (!input || !replacements) {
                    throw new Error("Both 'input' and 'replacements' are required for findAndReplace.");
                }
                result = findAndReplace(input, replacements);
                break;

            case "splitText":
                if (!text) {
                    throw new Error("'text' is required for splitText.");
                }
                result = splitText(text, delimiter, splitOnNewline);
                break;

            case "chunkText":
                if (!text || !chunkSize) {
                    throw new Error("Both 'text' and 'chunkSize' are required for chunkText.");
                }
                result = chunkText(text, chunkSize);
                break;

            default:
                throw new Error("Invalid action specified.");
        }

        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};