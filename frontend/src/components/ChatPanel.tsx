import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Plus, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { streamChat, sessionsApi } from '../lib/api';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message, Level, Language } from '../types';

const LANGUAGES: Language[] = ['javascript', 'typescript', 'python', 'java', 'cpp', 'rust', 'go', 'other'];
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

const QUICK_PROMPTS = [
  'Explain the difference between let, const, and var',
  'How do I handle async/await errors?',
  'What are design patterns I should know?',
  'Review my understanding of recursion',
  'Explain Big O notation with examples',
];

export function ChatPanel() {
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    addSession,
    updateSessionInStore,
    language,
    setLanguage,
    level,
    setLevel,
  } = useStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, streamingMessage, scrollToBottom]);

  const handleNewSession = async () => {
    try {
      const session = await sessionsApi.create(language, level);
      addSession(session);
      setActiveSession(session.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isLoading) return;

    let sessionId = activeSessionId;
    let session = activeSession;

    // Auto-create session if none active
    if (!sessionId || !session) {
      try {
        const newSession = await sessionsApi.create(language, level);
        addSession(newSession);
        setActiveSession(newSession.id);
        sessionId = newSession.id;
        session = newSession;
      } catch (err) {
        console.error('Failed to create session:', err);
        return;
      }
    }

    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    // Optimistically add user message to UI
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    updateSessionInStore({
      ...session,
      messages: [...session.messages, tempUserMessage],
    });

    let accumulated = '';

    streamChat(
      sessionId,
      text,
      (delta) => {
        accumulated += delta;
        setStreamingMessage(accumulated);
      },
      async () => {
        setStreamingMessage('');
        setIsLoading(false);
        // Refresh session from server
        try {
          const updated = await sessionsApi.get(sessionId!);
          updateSessionInStore(updated);
        } catch {}
      },
      (err) => {
        console.error('Stream error:', err);
        setIsLoading(false);
        setStreamingMessage('');
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  const messages = activeSession?.messages ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Session toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button onClick={handleNewSession} className="btn-secondary text-xs flex items-center gap-1">
            <Plus size={12} /> New Session
          </button>
          {activeSession && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {activeSession.title}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <label className="label mb-0">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="input py-1 w-auto"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="label mb-0">Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="input py-1 w-auto"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l} className="capitalize">{l}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !streamingMessage && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot size={48} className="text-primary-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome to Coding Mentor AI</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Ask me anything about programming — I'll explain concepts, review code, help debug, and guide your learning.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-sm p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {streamingMessage && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 card p-4 max-w-3xl">
              <MarkdownRenderer content={streamingMessage} />
              <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1" />
            </div>
          </div>
        )}

        {isLoading && !streamingMessage && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="card p-4">
              <Loader2 size={16} className="animate-spin text-primary-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about coding... (Shift+Enter for new line)"
            rows={1}
            className="input resize-none flex-1"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-primary-600 text-white'
          : 'bg-primary-100 dark:bg-primary-900'
      }`}>
        {isUser
          ? <User size={16} />
          : <Bot size={16} className="text-primary-600 dark:text-primary-400" />
        }
      </div>
      <div className={`max-w-3xl ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'card'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
