import { Plus, Trash2, MessageSquare, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { sessionsApi } from '../lib/api';

export function Sidebar() {
  const {
    sessions,
    activeSessionId,
    isSidebarOpen,
    addSession,
    removeSession,
    setActiveSession,
    setActiveTab,
    language,
    level,
  } = useStore();

  const handleNewSession = async () => {
    try {
      const session = await sessionsApi.create(language, level);
      addSession(session);
      setActiveSession(session.id);
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await sessionsApi.delete(id);
      removeSession(id);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleNewSession}
          className="w-full flex items-center justify-center gap-2 btn-primary text-sm py-2"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
          Recent Sessions
        </p>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
            <MessageSquare size={24} className="mb-2 opacity-50" />
            <p>No sessions yet</p>
            <p className="text-xs">Start a new chat!</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => {
                    setActiveSession(session.id);
                    setActiveTab('chat');
                  }}
                  className={`w-full flex items-start gap-2 p-2 rounded-lg text-left group transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <MessageSquare size={14} className="mt-0.5 flex-shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{session.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-gray-400 capitalize">{session.language}</span>
                      <ChevronRight size={10} className="text-gray-300" />
                      <span className="text-xs text-gray-400 capitalize">{session.level}</span>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(session.updatedAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded transition-all"
                    aria-label="Delete session"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
