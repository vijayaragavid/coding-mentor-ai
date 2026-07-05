import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { sessionsApi, authApi } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { CodeReviewPanel } from './components/CodeReviewPanel';
import { QuizPanel } from './components/QuizPanel';
import { ExplainPanel } from './components/ExplainPanel';
import { Header } from './components/Header';
import { AuthPage } from './components/AuthPage';

function App() {
  const { activeTab, darkMode, setSessions, user, setUser, token, logout } = useStore();

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Check if user is already logged in via token
  useEffect(() => {
    if (token && !user) {
      authApi.me()
        .then(data => setUser(data.user))
        .catch(() => logout());
    }
  }, [token, user, setUser, logout]);

  // Load sessions when user is logged in
  useEffect(() => {
    if (user) {
      sessionsApi.getAll().then(setSessions).catch(console.error);
    }
  }, [user, setSessions]);

  // Show login page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

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
