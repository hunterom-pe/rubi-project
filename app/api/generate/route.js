import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { claim, reason, length = "Medium" } = body || {};

    // Input Validation
    if (!claim || typeof claim !== "string" || !claim.trim()) {
      return NextResponse.json(
        { error: "Customer Claim Request is required." },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "Basic Denial Explanation is required." },
        { status: 400 }
      );
    }

    // Secure API Key Verification
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY environment variable is missing. Please set your Gemini API key in process.env or .env.local.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const lengthUpper = String(length).toUpperCase();

    const systemPrompt = `You are an expert customer service representative for a home warranty company.
Draft a polite, professional, firm, and empathetic email denying a warranty claim based on the details provided.

Inputs:
- Customer Claim: ${claim.trim()}
- Reason for Denial: ${reason.trim()}
- Length: ${lengthUpper}

Tone & Style Rules:
- Be empathetic to the homeowner's situation, but clear and firm on non-coverage.
- Strictly AVOID cliché AI phrases (e.g., "I hope this email finds you well", "Rest assured", "delve", "testament to").
- Length Guidelines:
  * SHORT: 2 concise paragraphs. Direct, polite denial with immediate next steps.
  * MEDIUM: 3 paragraphs. Empathetic opening, clear policy/reasoning explanation, professional closing.
  * LONG: 4+ paragraphs. Thorough breakdown, policy alignment, maintenance context, and appeal/contact steps.

Output: Return ONLY the formatted Subject Line and Email Body ready to send.`;

    let generatedContent = "";
    // Priority Cascade: gemini-3.6-flash -> gemini-3.5-flash -> gemini-2.5-pro -> gemini-2.5-flash -> gemini-1.5-pro
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-1.5-pro"
    ];
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
        });
        if (response && response.text) {
          generatedContent = response.text;
          console.log(`Successfully generated email draft using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} call failed:`, err?.message || err);
        lastError = err;
      }
    }

    if (!generatedContent) {
      throw new Error(lastError?.message || "Failed to generate content with available Gemini models.");
    }

    return NextResponse.json({ draft: generatedContent });
  } catch (error) {
    console.error("Error in /api/generate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate email draft. Please check your API key and network connection." },
      { status: 500 }
    );
  }
}
