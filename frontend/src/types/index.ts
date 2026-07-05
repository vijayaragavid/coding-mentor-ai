export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  line?: number;
  message: string;
  suggestion: string;
}

export interface ReviewResult {
  overall: string;
  score: number;
  issues: ReviewIssue[];
  positives: string[];
  improvedCode?: string;
  summary: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  hint: string;
}

export interface QuizResult {
  score: number;
  grade: string;
  correct: number;
  total: number;
  results: {
    id: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
  }[];
  feedback: string;
}

export interface CodeExplanation {
  summary: string;
  explanation: string;
  keyConceptsUsed: string[];
  complexity: {
    time: string;
    space: string;
    notes: string;
  };
  potentialIssues: string[];
  relatedTopics: string[];
}

export interface ConceptExplanation {
  concept: string;
  definition: string;
  analogy: string;
  explanation: string;
  example: {
    code: string;
    language: string;
    description: string;
  };
  commonMistakes: string[];
  bestPractices: string[];
  furtherReading: string[];
}

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'rust' | 'go' | 'other';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Tab = 'chat' | 'review' | 'quiz' | 'explain';

export interface User {
  id: string;
  name: string;
  email: string;
}
