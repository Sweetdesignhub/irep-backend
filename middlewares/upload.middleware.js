import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

// Common function to create storage for different file types
const createStorage = (folder, resourceType, format, fileSize) => {
  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        format: async (req, file) => format || file.mimetype.split("/")[1],
        public_id: (req, file) => `${folder}_${Date.now()}`,
        resource_type: resourceType, // "image", "video", "raw"
      },
    }),
    limits: { fileSize }, // Set file size limit
  });
};

// Multer instances for different file types
const uploadImages = createStorage("images", "image", null, 5 * 1024 * 1024); // 5MB
const uploadVoice = createStorage("voice", "video", "mp3", 10 * 1024 * 1024); // 10MB
const uploadVideos = createStorage("videos", "video", "mp4", 50 * 1024 * 1024); // 50MB
const uploadDatasets = createStorage(
  "datasets",
  "raw",
  "csv",
  500 * 1024 * 1024
); // 500MB

export { uploadImages, uploadVoice, uploadVideos, uploadDatasets };
