import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60 seconds for processing large PDFs

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

    // Convert file Buffer to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Pdf = buffer.toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const promptText = `Analyze this home inspection report PDF carefully.

Your task is to extract and organize all inspection defects into two main categories based on severity:
1. RED ITEMS: "Significant and/or Safety Concern", "Major Defects", "Safety Concerns", or equivalent high-priority items.
2. YELLOW ITEMS: "Possible Defects", "Maintenance Needed", "Repair / Replace Items", or equivalent moderate-priority items.

Grouping Rules:
- For each item, identify its section topic (e.g., "Insulation & Ventilation", "Roofing System", "Plumbing System", "Electrical System", "HVAC", "Exterior").
- Group items by their section topic.
- Extract item codes/numbers if present (e.g., "3.1.1", "4.2.3"). If missing, assign a sequential code like "1.1".
- Extract the item title (e.g. "General: Home Energy Rating System Evaluation Recommended").
- Provide a concise 1 to 2 sentence summary describing the defect and recommended action.

Return ONLY a valid JSON object matching this exact structure with NO markdown wrapping or formatting:
{
  "redItems": [
    {
      "code": "3.1.1",
      "section": "Insulation & Ventilation",
      "title": "Home Energy Rating System Evaluation Recommended",
      "summary": "1-2 sentence professional summary of the defect."
    }
  ],
  "yellowItems": [
    {
      "code": "3.2.1",
      "section": "Insulation & Ventilation",
      "title": "Attic Insulation: Displaced / Uneven / Depth Low",
      "summary": "1-2 sentence professional summary of the defect."
    }
  ]
}`;

    let jsonResultText = "";
    const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-pro", "gemini-2.5-flash"];

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

    // Clean JSON response
    const cleanedJson = jsonResultText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const parsedData = JSON.parse(cleanedJson);

    return NextResponse.json({
      redItems: parsedData.redItems || [],
      yellowItems: parsedData.yellowItems || [],
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
