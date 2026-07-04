import { Moon, Sun, Menu, Code2, MessageSquare, Search, Lightbulb, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Tab } from '../types';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
  { id: 'review', label: 'Code Review', icon: <Search size={16} /> },
  { id: 'quiz', label: 'Quiz', icon: <BookOpen size={16} /> },
  { id: 'explain', label: 'Explain', icon: <Lightbulb size={16} /> },
];

export function Header() {
  const { activeTab, setActiveTab, darkMode, toggleDarkMode, toggleSidebar } = useStore();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Code2 size={24} className="text-primary-600" />
            <span className="font-bold text-lg hidden sm:block">Coding Mentor AI</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
