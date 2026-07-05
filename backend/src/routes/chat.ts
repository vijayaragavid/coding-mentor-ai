import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { openai, MODEL, SYSTEM_PROMPTS } from '../lib/openai';
import { getSession, addMessage } from '../lib/sessionStore';
import { validate } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';
import { requireAuth } from '../lib/auth';

export const chatRouter = Router();

// All chat routes require auth
chatRouter.use(requireAuth);

const chatSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

chatRouter.post('/', validate(chatSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, message } = req.body;

    const session = getSession(sessionId);
    if (!session) {
      return next(createError('Session not found', 404));
    }

    // Add user message to session
    addMessage(sessionId, 'user', message);

    // Build conversation history for context (last 20 messages)
    const recentMessages = session.messages.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Prepend system context
    const systemMessage = {
      role: 'system' as const,
      content: `${SYSTEM_PROMPTS.mentor}\n\nContext: The learner is at the ${session.level} level and primarily working with ${session.language}.`,
    };

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [systemMessage, ...recentMessages],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = response.choices[0]?.message?.content ?? 'I could not generate a response.';
    addMessage(sessionId, 'assistant', assistantMessage);

    res.json({
      message: assistantMessage,
      usage: response.usage,
    });
  } catch (error) {
    next(error);
  }
});

// Streaming chat endpoint
chatRouter.post('/stream', validate(chatSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, message } = req.body;

    const session = getSession(sessionId);
    if (!session) {
      return next(createError('Session not found', 404));
    }

    addMessage(sessionId, 'user', message);

    const recentMessages = session.messages.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const systemMessage = {
      role: 'system' as const,
      content: `${SYSTEM_PROMPTS.mentor}\n\nContext: The learner is at the ${session.level} level and primarily working with ${session.language}.`,
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [systemMessage, ...recentMessages],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    addMessage(sessionId, 'assistant', fullContent);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    next(error);
  }
});
