import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found - AI grading will not work');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const AIGradingResultSchema = z.object({
  suggestedGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  feedback: z.string().min(1),
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(5),
  confidence: z.number().min(0).max(100)
});

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
  fileName: string,
  assignmentFileContent?: string
): Promise<AIGradingResult> {
  if (!genAI) {
    throw new Error("AI grading is not available - GEMINI_API_KEY not configured");
  }
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const assignmentFileSection = assignmentFileContent && assignmentFileContent !== '[Unable to fetch submission content]' 
    ? `\n**Assignment Instructions/Question Paper:**\n${assignmentFileContent}\n`
    : '';

  const prompt = `You are an academic evaluator for a blockchain-based lab evaluation system. 
Analyze the following student submission and provide a detailed assessment.

**Assignment Title:** ${assignmentTitle}
**Assignment Description:** ${assignmentDescription}
${assignmentFileSection}
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
    
    const rawParsed = JSON.parse(jsonMatch[0]);
    
    const validated = AIGradingResultSchema.safeParse(rawParsed);
    if (!validated.success) {
      console.error("AI response validation failed:", validated.error.errors);
      return {
        suggestedGrade: rawParsed.suggestedGrade || 'C',
        feedback: rawParsed.feedback || 'Unable to generate detailed feedback.',
        strengths: Array.isArray(rawParsed.strengths) ? rawParsed.strengths : ['Submission received'],
        improvements: Array.isArray(rawParsed.improvements) ? rawParsed.improvements : ['Manual review recommended'],
        confidence: typeof rawParsed.confidence === 'number' ? rawParsed.confidence : 50
      };
    }
    
    return validated.data;
  } catch (error) {
    console.error("AI grading error:", error);
    throw new Error(`AI grading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function analyzeSubmissionFile(
  ipfsHash: string,
  gatewayUrl: string,
  fileName?: string
): Promise<string> {
  try {
    console.log(`📄 Fetching file from IPFS: ${gatewayUrl}`);
    const response = await fetch(gatewayUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from IPFS: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    const fileExtension = fileName?.split('.').pop()?.toLowerCase() || '';
    
    console.log(`📄 File type: ${contentType}, extension: ${fileExtension}`);
    
    if (contentType.includes('application/pdf') || fileExtension === 'pdf') {
      console.log('📄 Extracting text from PDF...');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      const extractedText = pdfData.text.trim();
      console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
      return extractedText.slice(0, 15000);
    }
    
    if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
        fileExtension === 'docx') {
      console.log('📄 Extracting text from DOCX...');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      const extractedText = result.value.trim();
      console.log(`✅ Extracted ${extractedText.length} characters from DOCX`);
      return extractedText.slice(0, 15000);
    }
    
    if (contentType.includes('application/msword') || fileExtension === 'doc') {
      console.log('⚠️ DOC format not fully supported, attempting basic extraction...');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value.trim().slice(0, 15000);
      } catch {
        return "[DOC file format - text extraction limited. Please use DOCX for better results.]";
      }
    }
    
    if (contentType.includes('text/') || fileExtension === 'txt') {
      console.log('📄 Reading plain text file...');
      const content = await response.text();
      return content.slice(0, 15000);
    }
    
    console.log('📄 Attempting to read as text...');
    const content = await response.text();
    if (content && content.length > 0 && !content.includes('\x00')) {
      return content.slice(0, 15000);
    }
    
    return `[Binary file detected - ${fileExtension.toUpperCase()} format. Manual review recommended.]`;
  } catch (error) {
    console.error("Failed to fetch/extract submission content:", error);
    return "[Unable to extract file content - please review manually]";
  }
}
