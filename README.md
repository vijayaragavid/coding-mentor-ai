# Coding Mentor AI Agent

A full-stack AI-powered coding mentor with real-time chat, code review, quizzes, and code explanations.

## Features

- **AI Chat** — Conversational coding help with session history and streaming responses
- **Code Review** — Detailed analysis covering correctness, performance, security, and best practices
- **Quiz Generator** — AI-generated multiple-choice quizzes with hints and explanations
- **Code Explainer** — Explain code blocks or programming concepts at your level
- **Dark Mode** — Full dark/light theme support
- **Multi-language** — JavaScript, TypeScript, Python, Java, C++, Rust, Go

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| AI | OpenAI GPT-4o |
| Code Editor | CodeMirror 6 |
| State | Zustand |

## Quick Start

### 1. Install dependencies

```bash
# Install root + all workspaces
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY
```

### 3. Run development servers

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

## Project Structure

```
coding-mentor-ai/
├── backend/
│   └── src/
│       ├── index.ts           # Express app entry
│       ├── lib/
│       │   ├── openai.ts      # OpenAI client + prompts
│       │   └── sessionStore.ts # In-memory session storage
│       ├── middleware/
│       │   ├── errorHandler.ts
│       │   └── validate.ts
│       └── routes/
│           ├── chat.ts        # Chat + streaming endpoints
│           ├── codeReview.ts  # Code review endpoint
│           ├── quiz.ts        # Quiz generation + submission
│           ├── explain.ts     # Code + concept explanation
│           └── sessions.ts    # Session CRUD
└── frontend/
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── Header.tsx
        │   ├── Sidebar.tsx
        │   ├── ChatPanel.tsx
        │   ├── CodeReviewPanel.tsx
        │   ├── QuizPanel.tsx
        │   ├── ExplainPanel.tsx
        │   └── MarkdownRenderer.tsx
        ├── lib/api.ts         # API client + streaming
        ├── store/useStore.ts  # Global state (Zustand)
        └── types/index.ts     # Shared TypeScript types
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/sessions | Create new session |
| GET | /api/sessions | List all sessions |
| POST | /api/chat | Send chat message |
| POST | /api/chat/stream | Streaming chat (SSE) |
| POST | /api/review | Review code |
| POST | /api/quiz/generate | Generate quiz |
| POST | /api/quiz/submit | Submit quiz answers |
| POST | /api/explain/code | Explain code |
| POST | /api/explain/concept | Explain a concept |

## Environment Variables

```env
PORT=3001
OPENAI_API_KEY=sk-...
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```
