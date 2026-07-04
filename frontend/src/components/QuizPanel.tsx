import { useState } from 'react';
import { quizApi } from '../lib/api';
import { useStore } from '../store/useStore';
import type { QuizQuestion, QuizResult, Language, Level } from '../types';
import { BookOpen, Loader2, CheckCircle, XCircle, RotateCcw, Lightbulb } from 'lucide-react';

const LANGUAGES: Language[] = ['javascript', 'typescript', 'python', 'java', 'cpp', 'rust', 'go', 'other'];
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

export function QuizPanel() {
  const { language, setLanguage, level, setLevel } = useStore();
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setShowHints({});
    try {
      const data = await quizApi.generate(topic, language, level, count);
      setQuestions(data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await quizApi.submit(
        questions.map((q) => ({ id: q.id, correctAnswer: q.correctAnswer })),
        answers
      );
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setShowHints({});
  };

  const toggleHint = (id: string) => {
    setShowHints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getAnswerClass = (questionId: string, optionIndex: number) => {
    if (!result) return '';
    const questionResult = result.results.find((r) => r.id === questionId);
    if (!questionResult) return '';

    if (optionIndex === questionResult.correctAnswer) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }
    if (optionIndex === questionResult.userAnswer && !questionResult.isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    }
    return '';
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold">Coding Quiz</h1>
            <p className="text-sm text-gray-500">Test your knowledge with AI-generated questions</p>
          </div>
        </div>

        {/* Quiz Generator Form */}
        {questions.length === 0 && (
          <div className="card p-6 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="input">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="input">
                  {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., async/await, recursion, OOP"
                  className="input"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <div>
                <label className="label">Number of Questions</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                  min={1}
                  max={10}
                  className="input"
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : 'Generate Quiz'}
            </button>
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && !result && (
          <div className="space-y-4 animate-fade-in">
            {questions.map((q, idx) => (
              <div key={q.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold flex items-center justify-center text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium mb-3">{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <label
                          key={i}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            answers[q.id] === i
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === i}
                            onChange={() => setAnswers({ ...answers, [q.id]: i })}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => toggleHint(q.id)}
                      className="mt-3 text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <Lightbulb size={12} /> {showHints[q.id] ? 'Hide' : 'Show'} Hint
                    </button>
                    {showHints[q.id] && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                        💡 {q.hint}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Quiz'}
              </button>
              <button onClick={handleReset} className="btn-secondary">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Score Card */}
            <div className="card p-6 text-center">
              <div className={`text-6xl font-bold mb-2 ${
                result.score >= 80 ? 'text-green-500' : result.score >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {result.score}%
              </div>
              <div className="text-2xl font-semibold mb-1">Grade: {result.grade}</div>
              <p className="text-gray-500">{result.correct} correct out of {result.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{result.feedback}</p>
            </div>

            {/* Question Review */}
            {questions.map((q, idx) => {
              const questionResult = result.results.find((r) => r.id === q.id);
              if (!questionResult) return null;

              return (
                <div key={q.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                      questionResult.isCorrect
                        ? 'bg-green-100 dark:bg-green-900 text-green-600'
                        : 'bg-red-100 dark:bg-red-900 text-red-600'
                    }`}>
                      {questionResult.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-3">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border-2 ${getAnswerClass(q.id, i)}`}
                          >
                            <span className="text-sm">{opt}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                        <p className="font-medium mb-1">Explanation:</p>
                        <p className="text-gray-700 dark:text-gray-300">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <button onClick={handleReset} className="btn-primary w-full flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Start New Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
