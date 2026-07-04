import axios from 'axios';
import type {
  Session,
  ReviewResult,
  QuizQuestion,
  QuizResult,
  CodeExplanation,
  ConceptExplanation,
  Level,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Sessions
export const sessionsApi = {
  getAll: () => api.get<Session[]>('/sessions').then(r => r.data),
  create: (language: string, level: Level) =>
    api.post<Session>('/sessions', { language, level }).then(r => r.data),
  get: (id: string) => api.get<Session>(`/sessions/${id}`).then(r => r.data),
  update: (id: string, data: Partial<{ title: string; language: string; level: Level }>) =>
    api.patch<Session>(`/sessions/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

// Chat
export const chatApi = {
  send: (sessionId: string, message: string) =>
    api.post<{ message: string }>('/chat', { sessionId, message }).then(r => r.data),
};

// Code Review
export const reviewApi = {
  review: (code: string, language: string, context?: string) =>
    api.post<ReviewResult>('/review', { code, language, context }).then(r => r.data),
};

// Quiz
export const quizApi = {
  generate: (topic: string, language: string, difficulty: Level, count: number) =>
    api.post<{ questions: QuizQuestion[] }>('/quiz/generate', { topic, language, difficulty, count }).then(r => r.data),
  submit: (
    questions: { id: string; correctAnswer: number }[],
    answers: Record<string, number>
  ) =>
    api.post<QuizResult>('/quiz/submit', { questions, answers }).then(r => r.data),
};

// Explain
export const explainApi = {
  code: (
    code: string,
    language: string,
    level: Level,
    focus: 'overview' | 'line-by-line' | 'concepts' | 'complexity'
  ) =>
    api.post<CodeExplanation>('/explain/code', { code, language, level, focus }).then(r => r.data),
  concept: (concept: string, language: string, level: Level) =>
    api.post<ConceptExplanation>('/explain/concept', { concept, language, level }).then(r => r.data),
};

// Streaming chat
export async function streamChat(
  sessionId: string,
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
) {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) onChunk(parsed.delta);
          } catch {
            // ignore parse errors on incomplete chunks
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
