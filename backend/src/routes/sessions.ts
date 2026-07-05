import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createSession,
  getSession,
  getSessionsByUser,
  deleteSession,
  updateSession,
} from '../lib/sessionStore';
import { validate } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';
import { requireAuth } from '../lib/auth';

export const sessionsRouter = Router();

// All session routes require auth
sessionsRouter.use(requireAuth);

const createSchema = z.object({
  language: z.string().min(1).max(50).default('javascript'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  language: z.string().min(1).max(50).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

sessionsRouter.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const sessions = getSessionsByUser(userId);
  res.json(sessions);
});

sessionsRouter.post('/', validate(createSchema), (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { language, level } = req.body;
  const session = createSession(userId, language, level);
  res.status(201).json(session);
});

sessionsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const session = getSession(req.params.id);
  if (!session) return next(createError('Session not found', 404));
  const userId = (req as any).user.userId;
  if (session.userId !== userId) return next(createError('Forbidden', 403));
  res.json(session);
});

sessionsRouter.patch('/:id', validate(updateSchema), (req: Request, res: Response, next: NextFunction) => {
  const session = updateSession(req.params.id, req.body);
  if (!session) return next(createError('Session not found', 404));
  res.json(session);
});

sessionsRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const deleted = deleteSession(req.params.id);
  if (!deleted) return next(createError('Session not found', 404));
  res.status(204).send();
});
