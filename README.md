# Decision Tree to React Flow Diagram Generator

An agentic full-stack application that converts natural language descriptions of decision trees into interactive, production-ready React Flow diagrams with auto-generated PNG/SVG exports.

## Features

- **Natural Language Input**: Describe a decision tree in plain English
- **AI-Powered Code Generation**: Google Gemini 2.0 Flash generates structured diagram data
- **Interactive Visualization**: React Flow renders vertical decision tree diagrams
- **Auto-Export**: PNG/SVG images automatically download after generation
- **Production-Ready**: Fully typed, error-handled, CORS-enabled backend and frontend

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Google API Key** with Generative AI access

### Setup

1. **Clone and install**
   ```bash
   git clone <repo>
   cd AI_Flow
   npm install  # Frontend (if using workspace setup)
   cd backend && pip install -r requirements.txt
   cd ../frontend && npm install
   ```

2. **Configure environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Add GOOGLE_API_KEY to backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Update VITE_API_URL if needed
   ```

3. **Run**
   ```bash
   # Terminal 1: Backend
   cd backend
   uvicorn main:app --reload --port 8000
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev  # Runs on http://localhost:5173
   ```

4. **Test**
   - Open http://localhost:5173
   - Enter a decision tree description: *"Should I go outside? If it's raining, stay inside. If it's sunny, go to the park."*
   - Watch the diagram render and PNG auto-download

## Project Structure

```
AI_Flow/
├── backend/           # FastAPI + Gemini integration
├── frontend/          # React + React Flow + Tailwind
├── INSTRUCTIONS/      # Documentation (SETUP.md, BACKEND.md, etc.)
└── .gitignore
```

## Documentation

- **[INSTRUCTIONS/SETUP.md](INSTRUCTIONS/SETUP.md)** — Detailed setup and prerequisites
- **[INSTRUCTIONS/BACKEND.md](INSTRUCTIONS/BACKEND.md)** — Backend architecture and implementation
- **[INSTRUCTIONS/FRONTEND.md](INSTRUCTIONS/FRONTEND.md)** — Frontend architecture and components
- **[INSTRUCTIONS/PROMPT_ENGINEERING.md](INSTRUCTIONS/PROMPT_ENGINEERING.md)** — LLM prompt design and JSON schema
- **[INSTRUCTIONS/API_CONTRACT.md](INSTRUCTIONS/API_CONTRACT.md)** — API endpoint specifications
- **[INSTRUCTIONS/DEPLOYMENT.md](INSTRUCTIONS/DEPLOYMENT.md)** — Running, building, and deployment

## Architecture

**Backend**: FastAPI + Google Generative AI (Gemini 2.0 Flash)
- `POST /api/generate` — converts description → structured JSON (nodes/edges)
- `GET /health` — health check

**Frontend**: React + React Flow + dagre + Tailwind CSS
- `InputForm` — textarea for decision tree description
- `DecisionTreeDiagram` — renders interactive diagram (vertical layout)
- `ExportButtons` — download PNG/SVG with html-to-image + file-saver
- `App` — orchestrates state and auto-download

## Data Flow

```
User Input → API Call → Gemini LLM → JSON {nodes, edges} → dagre Layout → React Flow Render → html-to-image Export → Auto-Download PNG
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Google Generative AI, Pydantic, python-dotenv |
| Frontend | React, React Flow, dagre, html-to-image, file-saver, Tailwind CSS, Vite |
| Deployment | uvicorn (backend), vite build (frontend) |

## Error Handling

- **Backend**: Pydantic validation → LLM call with structured prompt → JSON parsing with retry on failure → 422/500 errors
- **Frontend**: Loading states, error banners, retry capability

## Future Enhancements

1. **Code Display Panel** — Show generated nodes/edges JSON for debugging/copying
2. **Extended Node Types** — Collapsible groups, parallel branches, loop handling
3. **Rate Limiting** — Prevent API abuse (production)
4. **Custom Styling** — User-defined node colors, shapes, edge styles
5. **Diagram Templates** — Pre-built samples (customer support flow, medical decision tree, etc.)

## License

MIT (or your choice)

## Support

For issues or questions, refer to the `INSTRUCTIONS/` folder or open an issue on the repo.
