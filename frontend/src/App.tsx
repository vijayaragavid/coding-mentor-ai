import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { sessionsApi } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { CodeReviewPanel } from './components/CodeReviewPanel';
import { QuizPanel } from './components/QuizPanel';
import { ExplainPanel } from './components/ExplainPanel';
import { Header } from './components/Header';

function App() {
  const { activeTab, darkMode, setSessions } = useStore();

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Load sessions on mount
  useEffect(() => {
    sessionsApi.getAll().then(setSessions).catch(console.error);
  }, [setSessions]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatPanel />}
          {activeTab === 'review' && <CodeReviewPanel />}
          {activeTab === 'quiz' && <QuizPanel />}
          {activeTab === 'explain' && <ExplainPanel />}
        </main>
      </div>
    </div>
  );
}

export default App;
