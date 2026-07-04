import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { explainApi } from '../lib/api';
import { useStore } from '../store/useStore';
import type { CodeExplanation, ConceptExplanation, Language, Level } from '../types';
import { Lightbulb, Loader2, Code, Tag, Clock, HardDrive, AlertTriangle, ArrowRight } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LANGUAGE_EXTENSIONS: Record<string, ReturnType<typeof javascript>> = {
  javascript: javascript({ jsx: true }),
  typescript: javascript({ jsx: true, typescript: true }),
  python: python(),
  java: java(),
  cpp: cpp(),
  rust: rust(),
};

const LANGUAGES: Language[] = ['javascript', 'typescript', 'python', 'java', 'cpp', 'rust', 'go', 'other'];
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

type Mode = 'code' | 'concept';
type Focus = 'overview' | 'line-by-line' | 'concepts' | 'complexity';

const FOCUS_OPTIONS: { value: Focus; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'line-by-line', label: 'Line by Line' },
  { value: 'concepts', label: 'Key Concepts' },
  { value: 'complexity', label: 'Complexity' },
];

export function ExplainPanel() {
  const { darkMode, language, setLanguage, level, setLevel } = useStore();
  const [mode, setMode] = useState<Mode>('code');
  const [code, setCode] = useState('');
  const [concept, setConcept] = useState('');
  const [focus, setFocus] = useState<Focus>('overview');
  const [codeResult, setCodeResult] = useState<CodeExplanation | null>(null);
  const [conceptResult, setConceptResult] = useState<ConceptExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExplain = async () => {
    setIsLoading(true);
    setError('');
    setCodeResult(null);
    setConceptResult(null);

    try {
      if (mode === 'code') {
        if (!code.trim()) return;
        const data = await explainApi.code(code, language, level, focus);
        setCodeResult(data);
      } else {
        if (!concept.trim()) return;
        const data = await explainApi.concept(concept, language, level);
        setConceptResult(data);
      }
    } catch (err) {
      setError('Failed to get explanation. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel */}
      <div className="w-2/5 flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setMode('code')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                mode === 'code' ? 'bg-white dark:bg-gray-600 font-medium shadow-sm' : 'text-gray-500'
              }`}
            >
              <Code size={14} className="inline mr-1" /> Explain Code
            </button>
            <button
              onClick={() => setMode('concept')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                mode === 'concept' ? 'bg-white dark:bg-gray-600 font-medium shadow-sm' : 'text-gray-500'
              }`}
            >
              <Lightbulb size={14} className="inline mr-1" /> Explain Concept
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="input text-sm py-1">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="label">Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="input text-sm py-1">
                {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {mode === 'code' ? (
          <>
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex gap-1">
                {FOCUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFocus(opt.value)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      focus === opt.value
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeMirror
                value={code}
                onChange={setCode}
                theme={darkMode ? githubDark : githubLight}
                extensions={[LANGUAGE_EXTENSIONS[language] ?? javascript()]}
                placeholder="Paste your code here..."
                height="100%"
                style={{ height: '100%' }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 p-4">
            <label className="label">Concept to Explain</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., closures, promises, inheritance"
              className="input"
              onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
            />
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Popular Concepts:</p>
              <div className="flex flex-wrap gap-2">
                {['Closures', 'Promises', 'Recursion', 'Big O Notation', 'Inheritance', 'Generics', 'Async/Await', 'Memoization'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setConcept(c)}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={handleExplain}
            disabled={isLoading || (mode === 'code' ? !code.trim() : !concept.trim())}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Explaining...</> : 'Explain'}
          </button>
        </div>
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        {!codeResult && !conceptResult && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Lightbulb size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Code & Concept Explainer</p>
            <p className="text-sm">Paste code or type a concept to get a clear explanation</p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
            <p>Generating explanation...</p>
          </div>
        )}

        {/* Code Explanation */}
        {codeResult && (
          <div className="space-y-4 animate-fade-in">
            <div className="card p-4">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-gray-700 dark:text-gray-300">{codeResult.summary}</p>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-3">Explanation</h3>
              <div className="text-sm">
                <MarkdownRenderer content={codeResult.explanation} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Clock size={14} /> Time Complexity</h3>
                <code className="text-sm text-primary-600 dark:text-primary-400">{codeResult.complexity.time}</code>
                {codeResult.complexity.notes && <p className="text-xs text-gray-500 mt-1">{codeResult.complexity.notes}</p>}
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><HardDrive size={14} /> Space Complexity</h3>
                <code className="text-sm text-primary-600 dark:text-primary-400">{codeResult.complexity.space}</code>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Tag size={14} /> Key Concepts Used</h3>
              <div className="flex flex-wrap gap-2">
                {codeResult.keyConceptsUsed.map((c) => (
                  <span key={c} className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {codeResult.potentialIssues.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={14} className="text-yellow-500" /> Potential Issues</h3>
                <ul className="space-y-1">
                  {codeResult.potentialIssues.map((issue, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">⚠</span> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {codeResult.relatedTopics.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><ArrowRight size={14} /> Learn More</h3>
                <div className="flex flex-wrap gap-2">
                  {codeResult.relatedTopics.map((t) => (
                    <span key={t} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Concept Explanation */}
        {conceptResult && (
          <div className="space-y-4 animate-fade-in">
            <div className="card p-4">
              <h2 className="text-xl font-bold mb-1">{conceptResult.concept}</h2>
              <p className="text-gray-700 dark:text-gray-300">{conceptResult.definition}</p>
            </div>

            <div className="card p-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold mb-2">Real-World Analogy</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">🌍 {conceptResult.analogy}</p>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-3">Explanation</h3>
              <div className="text-sm">
                <MarkdownRenderer content={conceptResult.explanation} />
              </div>
            </div>

            {conceptResult.example && (
              <div className="card p-4">
                <h3 className="font-semibold mb-2">Example</h3>
                <p className="text-sm text-gray-500 mb-2">{conceptResult.example.description}</p>
                <SyntaxHighlighter
                  style={darkMode ? oneDark : oneLight}
                  language={conceptResult.example.language}
                  customStyle={{ borderRadius: '0.5rem' }}
                >
                  {conceptResult.example.code}
                </SyntaxHighlighter>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="font-semibold mb-2">Common Mistakes</h3>
                <ul className="space-y-1">
                  {conceptResult.commonMistakes.map((m, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-red-500">✗</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <ul className="space-y-1">
                  {conceptResult.bestPractices.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-500">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-2">Further Reading</h3>
              <div className="flex flex-wrap gap-2">
                {conceptResult.furtherReading.map((t) => (
                  <span key={t} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
