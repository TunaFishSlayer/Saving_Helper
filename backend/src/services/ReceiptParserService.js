// backend/src/services/ReceiptParserService.js
import axios from "axios";
import path from "path";
import fs from "fs";
import logger from "../utils/logger.js";

const logInfo = (msg) => logger ? logger.info(msg) : console.log(msg);
const logError = (msg) => logger ? logger.error(msg) : console.error(msg);

// Default endpoint for the FastAPI OCR microservice
const MICROSERVICE_URL = process.env.OCR_MICROSERVICE_URL || "http://127.0.0.1:8000/parse-receipt";

/**
 * Service to send the uploaded receipt image to the persistent FastAPI microservice
 * @param {string} imagePath - Path to the uploaded local image
 * @returns {Promise<object>} - The parsed, structured JSON payload
 */
export const parseReceiptImage = async (imagePath) => {
  logInfo(`Forwarding receipt to OCR Microservice: ${imagePath}`);
  logInfo(`Target URL: ${MICROSERVICE_URL}`);

  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error("File not found on disk.");
    }

    // 1. Prepare FormData natively (supported fully in Node 22+)
    const fileBuffer = fs.readFileSync(imagePath);
    // Get filename for content-disposition
    const filename = path.basename(imagePath);
    // Wrap buffer in a Blob
    const blob = new Blob([fileBuffer]);

    const form = new FormData();
    form.append("file", blob, filename);

    // 2. Post via Axios to FastAPI (Timeout configured to 60s)
    const response = await axios.post(MICROSERVICE_URL, form, {
      headers: {
        // Content-Type is handled automatically by Axios with native FormData
      },
      timeout: 60000 // 60 seconds timeout
    });

    logInfo("Successfully received response from OCR Microservice.");

    // 3. Cleanup uploaded file
    cleanupFile(imagePath);

    // 4. Return JSON
    const result = response.data;
    if (result.error) {
      throw new Error(`AI parsing error: ${result.error}`);
    }
    return result;

  } catch (error) {
    // Always cleanup the temporary file in catch block
    cleanupFile(imagePath);

    // Standardize Axios errors
    if (error.response) {
      logError(`Microservice responded with error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      throw new Error(`OCR Microservice error: ${error.response.data?.detail || "Failed to parse receipt"}`);
    } else if (error.request) {
      logError(`Could not reach OCR Microservice at ${MICROSERVICE_URL}. Make sure the FastAPI server is running!`);
      throw new Error("Failed to connect to the OCR Microservice. Is it running?");
    } else {
      logError(`Request Setup Error: ${error.message}`);
      throw error;
    }
  }
};

/**
 * Helper to safely delete local temporary uploaded files
 */
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      logInfo(`Cleaned up temporary file: ${filePath}`);
    } catch (err) {
      logError(`Failed to cleanup file ${filePath}: ${err.message}`);
    }
  }
};
