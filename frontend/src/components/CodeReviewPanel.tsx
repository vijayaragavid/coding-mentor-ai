import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { reviewApi } from '../lib/api';
import { useStore } from '../store/useStore';
import type { ReviewResult, Language } from '../types';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Loader2, Code, Star } from 'lucide-react';

const LANGUAGE_EXTENSIONS: Record<string, ReturnType<typeof javascript>> = {
  javascript: javascript({ jsx: true }),
  typescript: javascript({ jsx: true, typescript: true }),
  python: python(),
  java: java(),
  cpp: cpp(),
  rust: rust(),
};

const LANGUAGES: Language[] = ['javascript', 'typescript', 'python', 'java', 'cpp', 'rust', 'go', 'other'];

const SAMPLE_CODE = {
  javascript: `function findDuplicates(arr) {
  let duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] == arr[j]) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

const nums = [1, 2, 3, 2, 4, 3, 5];
console.log(findDuplicates(nums));`,
};

export function CodeReviewPanel() {
  const { darkMode, language, setLanguage } = useStore();
  const [code, setCode] = useState(SAMPLE_CODE.javascript);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'improved'>('code');

  const handleReview = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await reviewApi.review(code, language, context || undefined);
      setResult(data);
    } catch (err) {
      setError('Failed to review code. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const severityIcon = {
    error: <AlertCircle size={14} className="text-red-500" />,
    warning: <AlertTriangle size={14} className="text-yellow-500" />,
    info: <Info size={14} className="text-blue-500" />,
  };

  const severityBg = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Code Input */}
      <div className="w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Code size={18} className="text-primary-600" />
          <h2 className="font-semibold">Code Input</h2>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="input py-1 text-sm w-auto"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={code}
            onChange={setCode}
            theme={darkMode ? githubDark : githubLight}
            extensions={[LANGUAGE_EXTENSIONS[language] ?? javascript()]}
            height="100%"
            style={{ height: '100%' }}
          />
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
          <input
            type="text"
            placeholder="Optional: describe what this code should do..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="input text-sm"
          />
          <button
            onClick={handleReview}
            disabled={isLoading || !code.trim()}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : 'Review Code'}
          </button>
        </div>
      </div>

      {/* Right: Results */}
      <div className="w-1/2 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {error && (
          <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!result && !isLoading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Code size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Code Review</p>
            <p className="text-sm">Paste your code and click "Review Code"</p>
          </div>
        )}

        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
            <p>Analyzing your code...</p>
          </div>
        )}

        {result && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in">
            {/* Score + Summary */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Overall Assessment</h3>
                <div className="flex items-center gap-1">
                  <Star size={16} className={scoreColor(result.score)} />
                  <span className={`text-xl font-bold ${scoreColor(result.score)}`}>{result.score}/10</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{result.overall}</p>
              <p className="text-xs text-gray-500 mt-2">{result.summary}</p>
            </div>

            {/* Positives */}
            {result.positives.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" /> What's Good
                </h3>
                <ul className="space-y-1">
                  {result.positives.map((p, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Issues Found</h3>
                <div className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${severityBg[issue.severity]}`}>
                      <div className="flex items-start gap-2">
                        {severityIcon[issue.severity]}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold uppercase tracking-wide">{issue.category}</span>
                            {issue.line && <span className="text-xs text-gray-500">Line {issue.line}</span>}
                          </div>
                          <p className="text-sm font-medium mt-0.5">{issue.message}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            💡 {issue.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improved Code */}
            {result.improvedCode && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`text-sm px-2 py-1 rounded ${activeTab === 'code' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-500'}`}
                  >Original</button>
                  <button
                    onClick={() => setActiveTab('improved')}
                    className={`text-sm px-2 py-1 rounded ${activeTab === 'improved' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-500'}`}
                  >Improved</button>
                </div>
                <CodeMirror
                  value={activeTab === 'improved' ? result.improvedCode : code}
                  theme={darkMode ? githubDark : githubLight}
                  extensions={[LANGUAGE_EXTENSIONS[language] ?? javascript()]}
                  editable={false}
                  maxHeight="300px"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
