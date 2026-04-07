import fs from "fs/promises";
import pdfParse from "pdf-parse";

export const extractTextFromPDF = async (filePath) => {
  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Read file
    const dataBuffer = await fs.readFile(filePath);
    
    // Parse PDF
    const pdfData = await pdfParse(dataBuffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }
    
    // Clean and trim text
    const cleanedText = pdfData.text
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E\n]/g, "")
      .trim();
    
    return cleanedText;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`PDF file not found: ${filePath}`);
    }
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
};