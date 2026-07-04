import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { openai, MODEL, SYSTEM_PROMPTS } from '../lib/openai';
import { validate } from '../middleware/validate';

export const codeReviewRouter = Router();

const reviewSchema = z.object({
  code: z.string().min(1).max(10000),
  language: z.string().min(1).max(50),
  context: z.string().max(500).optional(),
});

export interface ReviewResult {
  overall: string;
  score: number;
  issues: {
    severity: 'error' | 'warning' | 'info';
    category: string;
    line?: number;
    message: string;
    suggestion: string;
  }[];
  positives: string[];
  improvedCode?: string;
  summary: string;
}

codeReviewRouter.post('/', validate(reviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, context } = req.body;

    const prompt = `Review the following ${language} code${context ? ` (context: ${context})` : ''}:

\`\`\`${language}
${code}
\`\`\`

Return a JSON object with exactly this structure:
{
  "overall": "brief overall assessment",
  "score": <number 1-10>,
  "issues": [
    {
      "severity": "error|warning|info",
      "category": "correctness|performance|security|readability|best-practices|maintainability",
      "line": <optional line number>,
      "message": "description of the issue",
      "suggestion": "how to fix it"
    }
  ],
  "positives": ["list of things done well"],
  "improvedCode": "optional improved version of the code",
  "summary": "2-3 sentence summary with key takeaways"
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.codeReview + '\nALWAYS respond with valid JSON only. No extra text before or after the JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON even if model wraps it in markdown
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON');
    const review: ReviewResult = JSON.parse(jsonMatch[0]);
    res.json(review);
  } catch (error) {
    next(error);
  }
});
