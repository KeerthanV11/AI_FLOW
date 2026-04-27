# Plan: Decision Tree → React Flow Diagram App

## TL;DR
Build a full-stack agentic app: users describe decision trees in natural language → FastAPI backend sends to Google Gemini 2.0 Flash → returns structured JSON (nodes/edges) → React frontend renders interactive React Flow diagram (vertical layout) → auto-downloads PNG/SVG. Instruction `.md` files go in `INSTRUCTIONS/` for each major area.

---

## Complete Directory Structure

```
AI_Flow/
├── .gitignore
├── README.md
├── INSTRUCTIONS/
│   ├── SETUP.md                    # Environment setup & prerequisites
│   ├── BACKEND.md                  # Backend architecture & implementation guide
│   ├── FRONTEND.md                 # Frontend architecture & implementation guide
│   ├── PROMPT_ENGINEERING.md       # LLM prompt design & JSON schema spec
│   ├── API_CONTRACT.md             # API endpoint spec (request/response schemas)
│   └── DEPLOYMENT.md               # How to run, build, and deploy
│
├── backend/
│   ├── .env                        # GOOGLE_API_KEY, GEMINI_MODEL (git-ignored)
│   ├── .env.example                # Template with placeholder values (committed)
│   ├── requirements.txt            # Python dependencies
│   ├── main.py                     # FastAPI app entry point
│   ├── config.py                   # Env var loading & validation
│   ├── services/
│   │   ├── __init__.py
│   │   └── gemini_service.py       # Google Generative AI integration
│   ├── prompts/
│   │   └── decision_tree.py        # Prompt template for Gemini
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py              # Pydantic request/response models
│   └── utils/
│       ├── __init__.py
│       └── json_parser.py          # LLM response parsing & validation
│
├── frontend/
│   ├── .env                        # VITE_API_URL (git-ignored)
│   ├── .env.example                # Template with placeholder values (committed)
│   ├── index.html                  # Vite HTML entry
│   ├── package.json                # NPM deps & scripts
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── postcss.config.js           # PostCSS config for Tailwind
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.jsx                # React entry point
│       ├── App.jsx                 # Root component, state orchestration
│       ├── App.css                 # Global/base styles
│       ├── index.css               # Tailwind imports
│       ├── api/
│       │   └── generateTree.js     # API client — POST /api/generate
│       ├── components/
│       │   ├── InputForm.jsx       # Textarea + submit button
│       │   ├── DecisionTreeDiagram.jsx  # React Flow renderer
│       │   ├── ExportButtons.jsx   # PNG/SVG download buttons
│       │   └── LoadingSpinner.jsx  # Loading indicator
│       └── utils/
│           ├── layoutEngine.js     # dagre-based auto-layout
│           └── exportImage.js      # html-to-image export logic
```

---

## Instruction Files to Create (in `INSTRUCTIONS/`)

### 1. `INSTRUCTIONS/SETUP.md`
- Prerequisites: Node.js ≥18, Python ≥3.10, Google Cloud account with Gemini API access
- How to obtain a Google API key (Generative AI Studio / AI Platform)
- Step-by-step clone → env setup → install → run instructions for both backend and frontend
- Port assignments: backend on 8000, frontend on 5173 (Vite default)

### 2. `INSTRUCTIONS/BACKEND.md`
- Architecture overview: FastAPI + service layer pattern
- File-by-file responsibilities (main.py, config.py, gemini_service.py, schemas.py, json_parser.py, decision_tree.py prompt)
- CORS configuration details
- Error handling strategy: Pydantic validation → LLM call → JSON parse with retry
- How to add new endpoints or modify the prompt

### 3. `INSTRUCTIONS/FRONTEND.md`
- Architecture overview: Vite + React + React Flow + Tailwind + dagre
- Component hierarchy: App → InputForm + DecisionTreeDiagram + ExportButtons
- Data flow: user input → API call → JSON → dagre layout → React Flow render → image export
- How DecisionTreeDiagram works: receives raw nodes/edges, runs through layoutEngine, renders
- Export pipeline: html-to-image captures ReactFlow DOM → file-saver triggers download
- Auto-download behavior: fires 500ms after diagram render

### 4. `INSTRUCTIONS/PROMPT_ENGINEERING.md`
- The exact prompt template sent to Gemini
- JSON schema specification for nodes and edges
- Node types: "decision" (questions/conditions), "outcome" (leaf results), "root" (entry point)
- Edge labels: condition text on branches
- Example input/output pairs
- Tips for modifying the prompt for different diagram types

### 5. `INSTRUCTIONS/API_CONTRACT.md`
- `POST /api/generate` — request body, response body, error responses
- `GET /health` — health check
- Full JSON schema with field-level documentation
- Example curl commands
- Error codes and meanings

### 6. `INSTRUCTIONS/DEPLOYMENT.md`
- Local development: run backend + frontend concurrently
- Production: build frontend (vite build), serve backend with uvicorn/gunicorn
- Docker setup guidance (optional/future)
- Environment variable reference table

---

## Implementation Phases

### Phase 1: Scaffolding & Instruction Files (steps 1–6)

1. Create root `.gitignore` (covers .env, node_modules, __pycache__, venv, dist, build)
2. Create root `README.md` with project overview and quick start
3. Create all 6 instruction files in `INSTRUCTIONS/`
4. Scaffold `backend/` directory structure with all subdirectories and `__init__.py` files
5. Create `backend/.env.example` and `backend/requirements.txt`
6. Scaffold `frontend/` via Vite init (`npm create vite@latest frontend -- --template react`), then add Tailwind, create directory structure

### Phase 2: Backend Implementation (steps 7–12)

7. Create `backend/config.py` — loads .env, exports GOOGLE_API_KEY, GEMINI_MODEL, CORS_ORIGINS
8. Create `backend/models/schemas.py` — Pydantic models:
   - `GenerateRequest(description: str)` with min-length validation
   - `NodeData(label: str)`
   - `FlowNode(id: str, type: str, data: NodeData)`
   - `FlowEdge(id: str, source: str, target: str, label: str | None)`
   - `GenerateResponse(nodes: list[FlowNode], edges: list[FlowEdge])`
9. Create `backend/prompts/decision_tree.py` — prompt template with JSON schema spec, examples, and constraints
10. Create `backend/services/gemini_service.py` — configures google.generativeai, calls `model.generate_content()` with `response_mime_type="application/json"`, returns raw text
11. Create `backend/utils/json_parser.py` — strips markdown fences, `json.loads()`, validates against schema, returns parsed dict
12. Create `backend/main.py` — FastAPI app, CORS middleware, wires up `/api/generate` and `/health` endpoints

### Phase 3: Frontend Core (steps 13–16) *parallel where noted*

13. Install deps: `reactflow`, `dagre`, `html-to-image`, `file-saver` + configure Tailwind
14. Create `frontend/src/utils/layoutEngine.js` — `getLayoutedElements(nodes, edges, direction='TB')` using dagre *parallel with 15*
15. Create `frontend/src/utils/exportImage.js` — `exportAsPng(element, filename)`, `exportAsSvg(element, filename)` *parallel with 14*
16. Create `frontend/src/api/generateTree.js` — `generateTree(description)` function, POSTs to `VITE_API_URL/api/generate`

### Phase 4: Frontend Components (steps 17–21)

17. Create `frontend/src/components/LoadingSpinner.jsx` — simple Tailwind spinner
18. Create `frontend/src/components/InputForm.jsx`:
    - Textarea with placeholder example
    - Submit button with disabled/loading state
    - Error message display
    - Calls `onSubmit(description)` prop
19. Create `frontend/src/components/DecisionTreeDiagram.jsx`:
    - Accepts `nodes`, `edges` props
    - Runs through `getLayoutedElements()` for vertical TB layout
    - Renders `<ReactFlow>` with `<Controls>`, `<MiniMap>`, `<Background>`
    - Custom node styles: decision nodes (blue, rounded), outcome nodes (green, square), root (purple, bold)
    - `fitView()` on initial render via `onInit` callback
    - Exposes ref to wrapper div for image export
20. Create `frontend/src/components/ExportButtons.jsx`:
    - Two buttons: "Download PNG" and "Download SVG"
    - Accepts `flowRef` prop (ref to ReactFlow wrapper)
    - Calls exportImage utilities on click
21. Update `frontend/src/App.jsx`:
    - State: `nodes`, `edges`, `loading`, `error`, `diagramReady`
    - `handleSubmit`: calls API, sets nodes/edges, sets diagramReady
    - `useEffect` on `diagramReady`: triggers auto-download PNG after 500ms delay
    - Layout: header → InputForm → (loading spinner OR diagram + export buttons)
    - Uses `useRef` for ReactFlow wrapper, passes to ExportButtons

### Phase 5: Styling & Polish (step 22)

22. Tailwind styling across all components:
    - Responsive layout (flex/grid)
    - Input form: card-style with shadow, proper padding
    - Diagram area: min-h-[500px], border, rounded
    - Export buttons: styled action buttons
    - Error: red banner/toast
    - Loading: centered spinner with text

---

## Relevant Files

### Root
- `.gitignore` — .env, node_modules, __pycache__, venv, dist, build, .DS_Store
- `README.md` — Project overview, quick start

### Instruction Files
- `INSTRUCTIONS/SETUP.md` — Prerequisites & environment setup
- `INSTRUCTIONS/BACKEND.md` — Backend architecture guide
- `INSTRUCTIONS/FRONTEND.md` — Frontend architecture guide
- `INSTRUCTIONS/PROMPT_ENGINEERING.md` — LLM prompt design & JSON schema
- `INSTRUCTIONS/API_CONTRACT.md` — API endpoint specifications
- `INSTRUCTIONS/DEPLOYMENT.md` — Run, build, deploy instructions

### Backend
- `backend/main.py` — FastAPI app, CORS, endpoint wiring
- `backend/config.py` — Env var loading (dotenv)
- `backend/requirements.txt` — fastapi, uvicorn[standard], google-generativeai, python-dotenv, pydantic
- `backend/.env` / `backend/.env.example` — API keys & config
- `backend/services/gemini_service.py` — Gemini API integration, `generate_content()` call
- `backend/prompts/decision_tree.py` — Prompt template with schema spec
- `backend/models/schemas.py` — Pydantic models (GenerateRequest, GenerateResponse, FlowNode, FlowEdge)
- `backend/utils/json_parser.py` — LLM response JSON extraction & validation

### Frontend
- `frontend/src/App.jsx` — Root component, state management, auto-download orchestration
- `frontend/src/components/DecisionTreeDiagram.jsx` — React Flow renderer with dagre layout
- `frontend/src/components/InputForm.jsx` — User input form
- `frontend/src/components/ExportButtons.jsx` — PNG/SVG download buttons
- `frontend/src/components/LoadingSpinner.jsx` — Loading indicator
- `frontend/src/utils/layoutEngine.js` — dagre auto-layout (`getLayoutedElements`)
- `frontend/src/utils/exportImage.js` — html-to-image export (PNG/SVG)
- `frontend/src/api/generateTree.js` — API client
- `frontend/.env` / `frontend/.env.example` — VITE_API_URL
- `frontend/tailwind.config.js` — Tailwind config
- `frontend/vite.config.js` — Vite config

---

## Verification

1. **Backend health**: `curl http://localhost:8000/health` → `{"status": "ok"}`
2. **Backend generate**: `curl -X POST http://localhost:8000/api/generate -H "Content-Type: application/json" -d '{"description": "Should I take an umbrella? If raining yes, if sunny no"}'` → valid JSON with nodes/edges arrays
3. **Backend validation**: POST with empty description → 422 error
4. **Frontend render**: Submit description → vertical diagram appears with distinct node colors
5. **Auto-download**: PNG downloads automatically ~500ms after diagram appears
6. **Manual export**: Click PNG button → downloads PNG; click SVG button → downloads SVG
7. **CORS**: Frontend on :5173 communicates with backend on :8000 without errors
8. **End-to-end**: Full flow from input → loading → diagram → download works seamlessly

## Decisions

- **JSON data approach** (not executable code) — safer, deterministic rendering
- **Gemini 2.0 Flash** — fast, supports structured JSON output via `response_mime_type`
- **Vite** over CRA — faster dev/build, CRA deprecated
- **dagre** for layout — standard for directed graphs with React Flow
- **html-to-image** for export — lightweight, DOM-based, supports PNG + SVG
- **Service layer pattern** in backend — separates concerns (routes / services / models / utils)
- **Instruction files in INSTRUCTIONS/** — separate .md files per concern for maintainability

## Further Considerations

1. **Code display panel**: Optionally show generated JSON in a collapsible panel for debugging/copying. Recommend as nice-to-have after MVP.
2. **Node shape customization**: Decision nodes (blue/rounded) vs outcome nodes (green/square) vs root (purple). Implemented via custom CSS classes in DecisionTreeDiagram.
3. **Retry logic**: If Gemini returns invalid JSON, retry once with a stricter prompt before returning error to user.
