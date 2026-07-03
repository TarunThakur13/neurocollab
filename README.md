
<div align="center">
  <!-- You can add a logo or banner image here -->
  <h1>🧠 NeuroCollab</h1>
  <p><b>A Full-Stack, Multi-Agent AI Workspace</b></p>

  <a href="https://neurocollab-eta.vercel.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a>
  
  <br />
  <br />

  <!-- Tech Stack Badges -->
  <img src="https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

---

## 📖 Overview
NeuroCollab is a production-ready multi-agent AI workspace designed to handle complex, multi-step tasks. Instead of a standard chatbot, users submit tasks to a coordinated team of specialized AI agents working autonomously. The system utilizes an advanced agentic graph with Reflexion loops and streams the reasoning process live to the client.

## ✨ Key Features
* **Multi-Agent Pipeline:** A custom `LangGraph` architecture orchestrating 6 specialized nodes (Router, Orchestrator, ReACT Researcher, Parallel Workers, Synthesizer, Coder, and Reviewer).
* **Live Token Streaming:** Real-time LLM token streaming via WebSockets, allowing users to watch agent "thinking" and reasoning live with sub-50ms perceived latency.
* **Dynamic Agent Configuration:** Customize models, temperature, and specific instructions for individual agents via a persistent `Zustand` state store.
* **Secure Authentication:** Full JWT-based registration and login system with secured API endpoints and WebSocket connections.
* **Session Management:** Full CRUD capabilities for chat sessions, persisted and synchronized with a PostgreSQL backend.
* **Modern UI/UX:** Fully responsive design built with Tailwind CSS, including a seamless light/dark mode theme system.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** Next.js 15 (TypeScript)
* **Styling:** Tailwind CSS
* **State Management:** Zustand
* **Real-time:** WebSockets

### Backend & AI
* **Framework:** FastAPI (Python)
* **AI Orchestration:** LangGraph, LangChain
* **LLM Provider:** Groq API
* **Database:** PostgreSQL (SQLAlchemy ORM)
* **Security:** JWT Authentication, bcrypt password hashing

### Deployment
* **Frontend:** Vercel
* **Backend & DB:** Render

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* PostgreSQL installed and running

### 1. Clone the Repository
```bash
git clone [https://github.com/TarunThakur13/neurocollab.git](https://github.com/TarunThakur13/neurocollab.git)
cd neurocollab

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
