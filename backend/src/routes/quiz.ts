import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { openai, MODEL, SYSTEM_PROMPTS } from '../lib/openai';
import { validate } from '../middleware/validate';

export const quizRouter = Router();

const quizSchema = z.object({
  topic: z.string().min(1).max(100),
  language: z.string().min(1).max(50),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  count: z.number().int().min(1).max(10).default(5),
});

const submitSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    correctAnswer: z.number(),
  })),
  answers: z.record(z.string(), z.number()),
});

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  hint: string;
}

quizRouter.post('/generate', validate(quizSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, language, difficulty, count } = req.body;

    const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}" in ${language} at the ${difficulty} level.

Return a JSON object with exactly this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": <0-3 index of correct option>,
      "explanation": "why this answer is correct",
      "hint": "a helpful hint without giving away the answer"
    }
  ]
}

Make questions varied and educational. Include code snippets in questions where appropriate.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.quiz + '\nALWAYS respond with valid JSON only. No extra text before or after the JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON');
    const quiz = JSON.parse(jsonMatch[0]);
    res.json(quiz);
  } catch (error) {
    next(error);
  }
});

quizRouter.post('/submit', validate(submitSchema), (req: Request, res: Response) => {
  const { questions, answers } = req.body;

  let correct = 0;
  const results = questions.map((q: { id: string; correctAnswer: number }) => {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) correct++;
    return {
      id: q.id,
      isCorrect,
      userAnswer,
      correctAnswer: q.correctAnswer,
    };
  });

  const score = Math.round((correct / questions.length) * 100);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  res.json({
    score,
    grade,
    correct,
    total: questions.length,
    results,
    feedback: score >= 80
      ? 'Excellent work! You have a strong grasp of this topic.'
      : score >= 60
      ? 'Good effort! Review the questions you missed and try again.'
      : 'Keep practicing! Focus on the fundamentals and try again.',
  });
});
