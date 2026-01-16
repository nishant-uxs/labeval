import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AIGradingResult {
  suggestedGrade: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
}

export async function gradeSubmissionWithAI(
  assignmentTitle: string,
  assignmentDescription: string,
  submissionContent: string,
  fileName: string
): Promise<AIGradingResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an academic evaluator for a blockchain-based lab evaluation system. 
Analyze the following student submission and provide a detailed assessment.

**Assignment Title:** ${assignmentTitle}
**Assignment Description:** ${assignmentDescription}

**Student Submission File:** ${fileName}
**Submission Content:**
${submissionContent}

Please evaluate this submission and provide:
1. A suggested grade (A, B, C, D, or F)
2. Brief constructive feedback (2-3 sentences)
3. 2-3 key strengths of the submission
4. 2-3 areas for improvement
5. Confidence level (0-100) in your assessment

Respond in the following JSON format only:
{
  "suggestedGrade": "A/B/C/D/F",
  "feedback": "Your constructive feedback here",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "confidence": 85
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as AIGradingResult;
    return parsed;
  } catch (error) {
    console.error("AI grading error:", error);
    throw new Error(`AI grading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function analyzeSubmissionFile(
  ipfsHash: string,
  gatewayUrl: string
): Promise<string> {
  try {
    const response = await fetch(gatewayUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from IPFS: ${response.statusText}`);
    }
    const content = await response.text();
    return content.slice(0, 10000);
  } catch (error) {
    console.error("Failed to fetch submission content:", error);
    return "[Unable to fetch submission content]";
  }
}
