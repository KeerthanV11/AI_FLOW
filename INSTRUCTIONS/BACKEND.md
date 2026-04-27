# BACKEND.md — Backend Architecture & Implementation Guide

## Overview

The backend is a **FastAPI** application that acts as a bridge between the React frontend and Google's Generative AI API. It receives natural language decision tree descriptions, sends them to Gemini 2.0 Flash, parses the response into structured JSON (nodes and edges), and returns it to the frontend for visualization.

## Architecture Layers

```
Request (InputForm) 
    ↓
FastAPI Route (@app.post("/api/generate"))
    ↓
Pydantic Validation (GenerateRequest schema)
    ↓
Gemini Service (google.generativeai integration)
    ↓
LLM Response (raw text with JSON)
    ↓
JSON Parser (extract, validate, convert to schema)
    ↓
Pydantic Response (GenerateResponse schema)
    ↓
Frontend (React Flow render)
```

---

## File Structure

```
backend/
├── __init__.py                    # Package marker
├── main.py                        # FastAPI app, route definitions, CORS setup
├── config.py                      # Environment variable loading & validation
├── requirements.txt               # Python dependencies
├── .env                          # Runtime API keys (git-ignored)
├── .env.example                  # Template (committed to repo)
├── services/
│   ├── __init__.py
│   └── gemini_service.py         # google.generativeai wrapper
├── prompts/
│   ├── __init__.py
│   └── decision_tree.py          # Prompt template & schema definition
├── models/
│   ├── __init__.py
│   └── schemas.py                # Pydantic models (inputs/outputs)
└── utils/
    ├── __init__.py
    └── json_parser.py            # LLM response parsing & validation
```

---

## File-by-File Responsibilities

### `main.py`

**Purpose**: FastAPI application entry point, route handlers, middleware setup.

**Key Components**:
- `FastAPI()` app initialization
- CORS middleware configuration (allow requests from frontend origin)
- `@app.get("/health")` — health check endpoint
- `@app.post("/api/generate")` — main decision tree generation endpoint
- Request/response handling with error catching
- 422 validation errors, 500 server errors, 400 bad requests

**Pseudocode**:
```python
app = FastAPI()

# CORS for frontend
app.add_middleware(CORSMiddleware, ...)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/generate")
def generate_diagram(request: GenerateRequest):
    try:
        # Call Gemini service
        raw_response = call_gemini(request.description)
        
        # Parse JSON from response
        parsed = parse_json(raw_response)
        
        # Validate against schema
        response = GenerateResponse(**parsed)
        
        return response
    except ValidationError as e:
        raise HTTPException(422, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=str(e))
```

---

### `config.py`

**Purpose**: Load and manage environment variables. Acts as a single source of truth for configuration.

**Key Components**:
- `from dotenv import load_dotenv`
- `os.getenv()` calls with defaults
- Validate that required vars are set
- Export config for use in other modules

**Example**:
```python
from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not set in .env")
```

---

### `services/gemini_service.py`

**Purpose**: Wrapper around `google.generativeai` SDK. Handles all communication with Gemini API.

**Key Components**:
- `import google.generativeai as genai`
- Configure API key: `genai.configure(api_key=GOOGLE_API_KEY)`
- Get model: `genai.GenerativeModel(GEMINI_MODEL)`
- Call API: `model.generate_content(prompt, response_mime_type="application/json")`
- Return raw text response

**Key Function**:
```python
def generate_tree_from_description(description: str) -> str:
    """
    Sends description to Gemini with structured JSON prompt.
    Returns raw LLM response as string (contains JSON).
    """
    from config import GOOGLE_API_KEY, GEMINI_MODEL
    from prompts.decision_tree import get_prompt
    
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    
    prompt = get_prompt(description)
    
    response = model.generate_content(
        prompt,
        response_mime_type="application/json"
    )
    
    return response.text
```

---

### `prompts/decision_tree.py`

**Purpose**: Define the LLM prompt template. This is the heart of prompt engineering for this app.

**Key Components**:
- `get_prompt(description)` function that constructs the full prompt
- Clear instructions to return ONLY valid JSON
- JSON schema specification with examples
- Node type definitions (decision, outcome, root)
- Edge label instructions

**Strategy**:
- Instruct Gemini to return only valid JSON (no markdown, no extra text)
- Provide exact schema with field types and descriptions
- Include example input → output to guide the model
- Use `response_mime_type="application/json"` in the API call for structured output

**Example prompt structure**:
```
You are a decision tree to React Flow converter. 

Given the following decision tree description:
[USER_DESCRIPTION]

Generate ONLY a valid JSON object (no markdown, no extra text) with this exact structure:

{
  "nodes": [
    {"id": "node_1", "type": "root", "data": {"label": "Question or starting point"}},
    {"id": "node_2", "type": "decision", "data": {"label": "Question or decision"}},
    {"id": "node_3", "type": "outcome", "data": {"label": "Result or conclusion"}}
  ],
  "edges": [
    {"id": "edge_1", "source": "node_1", "target": "node_2", "label": "condition or branch"},
    {"id": "edge_2", "source": "node_2", "target": "node_3", "label": "Yes"}
  ]
}

Rules:
- Node IDs must be unique (node_1, node_2, etc.)
- Types: "root" (entry), "decision" (question/condition), "outcome" (result)
- Labels should be concise (max 50 chars)
- Edges must have source → target
- Edge labels are optional but recommended for clarity
- Return ONLY the JSON object, nothing else.

Example:
Input: "Should I take an umbrella? If it's raining, yes. If it's sunny, no."
Output: 
{
  "nodes": [
    {"id": "node_1", "type": "root", "data": {"label": "Should I take an umbrella?"}},
    {"id": "node_2", "type": "outcome", "data": {"label": "Yes, take umbrella"}},
    {"id": "node_3", "type": "outcome", "data": {"label": "No, don't take"}}
  ],
  "edges": [
    {"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Raining"},
    {"id": "edge_2", "source": "node_1", "target": "node_3", "label": "Sunny"}
  ]
}
```

---

### `models/schemas.py`

**Purpose**: Define Pydantic models for request/response validation and typing.

**Key Models**:

1. **`GenerateRequest`** — incoming request
   ```python
   class GenerateRequest(BaseModel):
       description: str = Field(..., min_length=10, max_length=5000)
       # Validates user input
   ```

2. **`NodeData`** — node label
   ```python
   class NodeData(BaseModel):
       label: str
   ```

3. **`FlowNode`** — individual node
   ```python
   class FlowNode(BaseModel):
       id: str
       type: str  # "root" | "decision" | "outcome"
       data: NodeData
   ```

4. **`FlowEdge`** — connection between nodes
   ```python
   class FlowEdge(BaseModel):
       id: str
       source: str  # node ID
       target: str  # node ID
       label: Optional[str] = None
   ```

5. **`GenerateResponse`** — outgoing response
   ```python
   class GenerateResponse(BaseModel):
       nodes: List[FlowNode]
       edges: List[FlowEdge]
   ```

---

### `utils/json_parser.py`

**Purpose**: Parse and validate LLM response. Handles edge cases where the model returns markdown-fenced JSON or invalid format.

**Key Function**:
```python
def parse_json_response(text: str) -> dict:
    """
    Extract JSON from LLM response.
    Handles markdown fences (```json ... ```).
    Validates structure.
    """
    # Strip markdown fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text[text.find('{'):text.rfind('}')+1]
    
    # Parse JSON
    data = json.loads(text)
    
    # Basic validation
    assert "nodes" in data and isinstance(data["nodes"], list)
    assert "edges" in data and isinstance(data["edges"], list)
    assert len(data["nodes"]) > 0
    
    return data
```

---

## CORS Configuration

**Purpose**: Allow frontend (http://localhost:5173) to make requests to backend (http://localhost:8000).

```python
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Error Handling Strategy

### Input Validation (422)
Pydantic automatically validates `GenerateRequest`. If `description` is too short or invalid:
```python
# Pydantic raises ValidationError → FastAPI returns 422
```

### LLM Failure (500)
If Gemini API fails or returns invalid JSON:
```python
try:
    response = parsed = parse_json_response(raw_response)
except json.JSONDecodeError:
    # Log error, return 500
    raise HTTPException(500, detail="Failed to parse LLM response")
```

### Retry Strategy (Optional)
For robustness, retry once if JSON parsing fails:
```python
def generate_tree_with_retry(description: str, retries=1):
    for attempt in range(retries + 1):
        try:
            raw = gemini_service.generate_tree_from_description(description)
            parsed = parse_json_response(raw)
            return GenerateResponse(**parsed)
        except Exception as e:
            if attempt == retries:
                raise HTTPException(500, detail=str(e))
            # Retry with stricter prompt
```

---

## Adding New Endpoints

To add a new endpoint (e.g., `/api/validate`):

1. Create a new Pydantic model for input/output in `models/schemas.py`
2. Add logic in a new service file or existing one
3. Create route in `main.py`:
   ```python
   @app.post("/api/validate")
   def validate_tree(request: ValidateRequest):
       # Logic
       return ValidateResponse()
   ```

---

## Testing the Backend

### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

### Generate Endpoint
```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "Should I go outside? If raining, stay in. If sunny, go to park."}'
```

### Validation Error
```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "short"}'
# Expected 422: description must be 10+ chars
```

---

## Dependencies

See `backend/requirements.txt`:
- `fastapi` — Web framework
- `uvicorn[standard]` — ASGI server
- `google-generativeai` — Google Generative AI SDK
- `pydantic` — Data validation (comes with FastAPI)
- `python-dotenv` — Environment variable loading

---

## Best Practices

1. **Never log API keys** — Ensure `.env` is in `.gitignore`
2. **Use Pydantic models** — Always validate input/output
3. **Separate concerns** — Keep prompt, service, schema, parser separate
4. **Error handling** — Always catch and return meaningful HTTP errors
5. **CORS carefully** — Only allow necessary origins
6. **Stateless** — Each request should be self-contained (no session state)

---

## Modifying the Prompt

To improve LLM output quality:

1. Edit `backend/prompts/decision_tree.py`
2. Update the prompt template with clearer instructions or examples
3. Test with `curl` or the frontend
4. Commit changes once validated

**Common adjustments**:
- Tighten constraints (max 3 levels deep, max 5 nodes, etc.)
- Add more examples
- Specify node label max length
- Request specific edge label formats (Yes/No vs conditional)
