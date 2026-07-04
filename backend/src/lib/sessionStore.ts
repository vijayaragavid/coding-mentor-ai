import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store (replace with a database in production)
const sessions = new Map<string, Session>();

export function createSession(language = 'javascript', level: Session['level'] = 'beginner'): Session {
  const session: Session = {
    id: uuidv4(),
    title: 'New Session',
    messages: [],
    language,
    level,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function getAllSessions(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

export function addMessage(sessionId: string, role: Message['role'], content: string): Message | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const message: Message = {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date(),
  };

  session.messages.push(message);
  session.updatedAt = new Date();

  // Auto-generate title from first user message
  if (session.title === 'New Session' && role === 'user') {
    session.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
  }

  return message;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export function updateSession(id: string, updates: Partial<Pick<Session, 'title' | 'language' | 'level'>>): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates, { updatedAt: new Date() });
  return session;
}
