import { v4 as uuidv4 } from 'uuid';
import db from './database';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

export function createSession(
  userId: string,
  language = 'javascript',
  level: Session['level'] = 'beginner'
): Session {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, title, language, level, created_at, updated_at)
    VALUES (?, ?, 'New Session', ?, ?, ?, ?)
  `).run(id, userId, language, level, now, now);

  return {
    id,
    userId,
    title: 'New Session',
    messages: [],
    language,
    level,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSession(id: string): Session | undefined {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  const messages = db.prepare(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC'
  ).all(id) as any[];

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    language: row.language,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  };
}

export function getSessionsByUser(userId: string): Omit<Session, 'messages'>[] {
  const rows = db.prepare(
    'SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(userId) as any[];

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    language: row.language,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: [],
  }));
}

export function addMessage(
  sessionId: string,
  role: Message['role'],
  content: string
): Message | null {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;
  if (!session) return null;

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (id, session_id, role, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, sessionId, role, content, timestamp);

  // Update session updated_at and title
  db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(timestamp, sessionId);

  // Auto title from first user message
  if (role === 'user' && session.title === 'New Session') {
    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, sessionId);
  }

  return { id, role, content, timestamp };
}

export function deleteSession(id: string): boolean {
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateSession(
  id: string,
  updates: Partial<Pick<Session, 'title' | 'language' | 'level'>>
): Session | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.language) { fields.push('language = ?'); values.push(updates.language); }
  if (updates.level) { fields.push('level = ?'); values.push(updates.level); }
  if (fields.length === 0) return getSession(id) || null;

  values.push(new Date().toISOString(), id);
  db.prepare(`UPDATE sessions SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(...values);

  return getSession(id) || null;
}
