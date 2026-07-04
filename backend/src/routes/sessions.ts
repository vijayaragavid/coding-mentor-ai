import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createSession,
  getSession,
  getAllSessions,
  deleteSession,
  updateSession,
} from '../lib/sessionStore';
import { validate } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';

export const sessionsRouter = Router();

const createSchema = z.object({
  language: z.string().min(1).max(50).default('javascript'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  language: z.string().min(1).max(50).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

sessionsRouter.get('/', (_req: Request, res: Response) => {
  const sessions = getAllSessions();
  res.json(sessions);
});

sessionsRouter.post('/', validate(createSchema), (req: Request, res: Response) => {
  const { language, level } = req.body;
  const session = createSession(language, level);
  res.status(201).json(session);
});

sessionsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const session = getSession(req.params.id);
  if (!session) return next(createError('Session not found', 404));
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
