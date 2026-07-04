import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { openai, MODEL, SYSTEM_PROMPTS } from '../lib/openai';
import { validate } from '../middleware/validate';

export const explainRouter = Router();

const explainSchema = z.object({
  code: z.string().min(1).max(10000),
  language: z.string().min(1).max(50),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  focus: z.enum(['overview', 'line-by-line', 'concepts', 'complexity']).default('overview'),
});

const conceptSchema = z.object({
  concept: z.string().min(1).max(200),
  language: z.string().min(1).max(50),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});

explainRouter.post('/code', validate(explainSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, level, focus } = req.body;

    const focusInstructions = {
      overview: 'Provide a high-level overview of what the code does and its main components.',
      'line-by-line': 'Explain each significant line or block of code step by step.',
      concepts: 'Focus on the key programming concepts, patterns, and techniques used.',
      complexity: 'Analyze the time and space complexity, and discuss performance characteristics.',
    };

    const prompt = `Explain this ${language} code for a ${level} level developer.
Focus: ${focusInstructions[focus as keyof typeof focusInstructions]}

\`\`\`${language}
${code}
\`\`\`

Return a JSON object with exactly this structure:
{
  "summary": "1-2 sentence summary of what the code does",
  "explanation": "detailed explanation based on the focus",
  "keyConceptsUsed": ["concept1", "concept2"],
  "complexity": {
    "time": "O(?) analysis",
    "space": "O(?) analysis",
    "notes": "any important notes about complexity"
  },
  "potentialIssues": ["any potential issues or edge cases"],
  "relatedTopics": ["topics to learn more about"]
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.explain + '\nALWAYS respond with valid JSON only. No extra text before or after the JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    next(error);
  }
});

explainRouter.post('/concept', validate(conceptSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { concept, language, level } = req.body;

    const prompt = `Explain the programming concept "${concept}" in the context of ${language} for a ${level} developer.

Return a JSON object with exactly this structure:
{
  "concept": "${concept}",
  "definition": "clear, concise definition",
  "analogy": "real-world analogy to help understand",
  "explanation": "detailed explanation appropriate for ${level} level",
  "example": {
    "code": "code example in ${language}",
    "language": "${language}",
    "description": "what the example demonstrates"
  },
  "commonMistakes": ["mistake1", "mistake2"],
  "bestPractices": ["practice1", "practice2"],
  "furtherReading": ["topic to explore next"]
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.mentor + '\nALWAYS respond with valid JSON only. No extra text before or after the JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    next(error);
  }
});
