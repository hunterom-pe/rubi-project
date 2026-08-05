import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { PDFDocument, PDFName } from "pdf-lib";
import { jsonrepair } from "jsonrepair";

export const maxDuration = 60; // Allow up to 60s for PDF parsing & image extraction

// Helper to extract ALL embedded images from a specific page in a PDF using pre-loaded pdfDoc
function extractAllImagesFromPage(pdfDoc, pageNum) {
  const images = [];
  try {
    const pages = pdfDoc.getPages();
    if (!pageNum || pageNum < 1 || pageNum > pages.length) return images;

    const page = pages[pageNum - 1];
    const resources = page.node.Resources();
    if (!resources) return images;

    const xObjectDict = resources.get(PDFName.of("XObject"));
    if (!xObjectDict) return images;

    const keys = xObjectDict.keys ? xObjectDict.keys() : [];
    for (const key of keys) {
      const xObject = xObjectDict.get(key);
      const stream = pdfDoc.context.lookup(xObject);
      if (stream && stream.dict) {
        const subtype = stream.dict.get(PDFName.of("Subtype"));
        if (subtype === PDFName.of("Image")) {
          const contents = stream.getContents();
          // Filter out tiny UI elements/icons (< 2000 bytes)
          if (contents && contents.length > 2000) {
            const filter = stream.dict.get(PDFName.of("Filter"));
            let mime = "image/png";
            if (filter === PDFName.of("DCTDecode") || filter?.toString() === "/DCTDecode") {
              mime = "image/jpeg";
            }
            images.push({
              mime,
              base64: Buffer.from(contents).toString("base64"),
              dataUrl: `data:${mime};base64,${Buffer.from(contents).toString("base64")}`,
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn(`Image extraction failed for page ${pageNum}:`, e.message);
  }
  return images;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF inspection file." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Pdf = buffer.toString("base64");

    // Load PDF once in memory for ultra-fast image extractions
    let pdfDoc = null;
    try {
      pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    } catch (pdfErr) {
      console.warn("pdf-lib pre-load warning:", pdfErr.message);
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = `Analyze this home inspection report PDF carefully.

Your task is to extract ALL inspection defect findings from Page 1 through the VERY LAST PAGE of the report.

CRITICAL INSTRUCTIONS:
- DO NOT STOP, CAP, OR TRUNCATE THE LIST. Extract EVERY SINGLE RED AND YELLOW FINDING IN THE ENTIRE DOCUMENT.
- Ensure string values in JSON do NOT contain unescaped quotes or raw newlines. Use single quotes or spaces inside strings.

Categorize every item based on severity:
1. RED ITEMS: "Significant and/or Safety Concern", "Major Defects", "Safety Hazards", or equivalent high-priority items.
2. YELLOW ITEMS: "Possible Defects", "Maintenance Needed", "Repair / Replace Items", or equivalent moderate-priority items.

Grouping Rules:
- For each item, identify its section topic (e.g., "Insulation & Ventilation", "Roofing System", "Plumbing System", "Electrical System", "HVAC", "Exterior").
- Group items by their section topic.
- Extract item codes/numbers if present (e.g., "3.1.1", "4.2.3"). If missing, assign a sequential code like "1.1".
- Extract the item title (e.g. "General: Home Energy Rating System Evaluation Recommended").
- Identify the exact page number (1-based integer) where this finding or photos appear in the PDF report.
- Provide a concise 1 to 2 sentence summary describing the defect and recommended action.

Return ONLY a valid JSON object matching this exact structure with NO markdown wrapping or formatting:
{
  "redItems": [
    {
      "code": "3.1.1",
      "section": "Insulation & Ventilation",
      "title": "Home Energy Rating System Evaluation Recommended",
      "summary": "1-2 sentence professional summary of the defect.",
      "pageNumber": 12
    }
  ],
  "yellowItems": [
    {
      "code": "3.2.1",
      "section": "Insulation & Ventilation",
      "title": "Attic Insulation: Displaced / Uneven / Depth Low",
      "summary": "1-2 sentence professional summary of the defect.",
      "pageNumber": 14
    }
  ]
}`;

    let jsonResultText = "";
    const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf,
              },
            },
            promptText,
          ],
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
          },
        });

        if (response && response.text) {
          jsonResultText = response.text;
          console.log(`Successfully parsed PDF using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} parsing failed:`, err?.message || err);
      }
    }

    if (!jsonResultText) {
      throw new Error("Failed to extract inspection items from PDF using Gemini.");
    }

    const cleanedJson = jsonResultText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    
    // Use jsonrepair to automatically repair unescaped quotes or newlines inside JSON strings
    let parsedData = { redItems: [], yellowItems: [] };
    try {
      const repairedJson = jsonrepair(cleanedJson);
      parsedData = JSON.parse(repairedJson);
    } catch (parseErr) {
      console.warn("JSON repair fallback error:", parseErr.message);
      parsedData = JSON.parse(cleanedJson);
    }

    const redItemsRaw = parsedData.redItems || [];
    const yellowItemsRaw = parsedData.yellowItems || [];

    // Extract ALL images for RED items from the PDF pages using pre-loaded pdfDoc
    const redItemsWithImages = redItemsRaw.map((item) => {
      if (pdfDoc && item.pageNumber) {
        const images = extractAllImagesFromPage(pdfDoc, item.pageNumber);
        return {
          ...item,
          images, // Array of ALL images found on that defect page!
          imageUrl: images[0]?.dataUrl || null,
          imageBase64: images[0]?.base64 || null,
        };
      }
      return { ...item, images: [] };
    });

    return NextResponse.json({
      redItems: redItemsWithImages,
      yellowItems: yellowItemsRaw,
      fileName: file.name,
    });
  } catch (error) {
    console.error("API Parse Inspection Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while parsing the inspection PDF." },
      { status: 500 }
    );
  }
}
