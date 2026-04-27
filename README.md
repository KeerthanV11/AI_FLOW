# AI Flow

Generate, visualize, and integrate validation testing diagrams with AI for regulated industries.

## Prerequisites

- **Python** ≥ 3.10
- **Node.js** ≥ 18
- Azure OpenAI access (endpoint, API key, deployment name)

---

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<your-api-key>
AZURE_OPENAI_DEPLOYMENT_NAME=<your-deployment>
AZURE_OPENAI_API_VERSION=2025-04-01-preview
```

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Running the Project

Open two terminals:

**Terminal 1 — Backend** (port 8000):
```bash
cd backend
.\venv\Scripts\python.exe run.py
```

**Terminal 2 — Frontend** (port 5173):
```bash
cd frontend
node ./node_modules/vite/bin/vite.js
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
AI_Flow/
├── backend/           # Flask + Azure OpenAI
│   ├── app/
│   │   ├── api/       # REST endpoints (/api/generate, /api/v1/...)
│   │   ├── prompts/   # LLM prompt templates per diagram type
│   │   ├── services/  # Diagram generation logic
│   │   ├── llm/       # Azure OpenAI provider
│   │   └── utils/     # Cache, JSON parser, token tracker
│   ├── run.py         # Entry point
│   └── ai_flow.py     # Python SDK facade
├── frontend/          # React + ReactFlow + Tailwind
│   └── src/
│       ├── components/ # Diagram, InputForm, ExportButtons
│       └── utils/      # Layout engine, export helpers
└── INTEGRATION.md     # Integration guide for external agents
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Generate a diagram |
| `POST` | `/api/v1/diagram/generate` | Generate (versioned, with request ID) |
| `POST` | `/api/v1/diagram/generate-batch` | Batch generate up to 10 diagrams |
| `GET`  | `/health` | Health check |

**Request body:**
```json
{
  "description": "Your testing strategy description...",
  "diagram_type": "decision_tree"
}
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Flask, Azure OpenAI, python-dotenv, Flasgger |
| Frontend | React 18, ReactFlow 11, dagre, Tailwind CSS, Vite |
