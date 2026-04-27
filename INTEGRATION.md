# AI Flow Diagrams — Feature Overview & Integration Guide

AI Flow is an LLM-powered diagram generation feature that converts natural-language descriptions into structured, interactive diagrams. It is designed as a standalone module that can be integrated into larger systems — such as a **Validation Plans Writer Agent** — via a Python SDK, REST API, or embeddable React components.

---

## Table of Contents

1. [What AI Flow Does](#1-what-ai-flow-does)
2. [Supported Diagram Types](#2-supported-diagram-types)
3. [Architecture Overview](#3-architecture-overview)
4. [Integration Method 1 — Python SDK](#4-integration-method-1--python-sdk)
5. [Integration Method 2 — REST API](#5-integration-method-2--rest-api)
6. [Integration Method 3 — React Components](#6-integration-method-3--react-components)
7. [Data Contracts](#7-data-contracts)
8. [Configuration Reference](#8-configuration-reference)
9. [Error Handling](#9-error-handling)
10. [Example: Writer Agent Integration Scenario](#10-example-writer-agent-integration-scenario)

---

## 1. What AI Flow Does

Given a plain-text description like:

> "User logs in. If MFA is enabled, prompt for a code. If the code is valid, grant access. Otherwise, deny access."

AI Flow calls an LLM (Azure OpenAI) and returns a structured JSON graph:

```json
{
  "nodes": [
    { "id": "node_1", "type": "start", "data": { "label": "User logs in" } },
    { "id": "node_2", "type": "decision", "data": { "label": "MFA enabled?" } },
    { "id": "node_3", "type": "process", "data": { "label": "Prompt for code" } },
    { "id": "node_4", "type": "end", "data": { "label": "Grant access" } },
    { "id": "node_5", "type": "end", "data": { "label": "Deny access" } }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2", "label": null },
    { "id": "edge_2", "source": "node_2", "target": "node_3", "label": "Yes" },
    { "id": "edge_3", "source": "node_2", "target": "node_5", "label": "No" },
    { "id": "edge_4", "source": "node_3", "target": "node_4", "label": "Valid" }
  ]
}
```

This JSON is consumed by the frontend (React Flow) or directly by any backend consumer.

---

## 2. Supported Diagram Types

| Type ID                | Description                                       | Node Types                                 |
|------------------------|---------------------------------------------------|--------------------------------------------|
| `decision_tree`        | Yes/No branching trees (CSV validation, risk)     | `root`, `decision`, `outcome`              |
| `system_architecture`  | Services, databases, clients, protocols           | `client`, `service`, `database`, `external`|
| `data_flow`            | Data movement between entities and stores         | `external_entity`, `process`, `data_store` |
| `process_flow`         | Sequential workflows with decision points         | `start`, `process`, `decision`, `end`      |

All types return the same `{ nodes, edges }` structure — only node `type` values differ.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     AI Flow Backend                      │
│                                                          │
│  ┌──────────────┐   ┌────────────────┐   ┌────────────┐ │
│  │  REST API     │   │  SDK Facade    │   │  Prompts   │ │
│  │  /api/v1/     │   │  ai_flow.py    │   │  per type  │ │
│  │  diagram/     │   │  DiagramGen.   │   │            │ │
│  └──────┬───────┘   └───────┬────────┘   └─────┬──────┘ │
│         │                   │                   │        │
│         └─────────┬─────────┘                   │        │
│                   ▼                             │        │
│         ┌─────────────────┐                     │        │
│         │ diagram_service  │◄────────────────────┘        │
│         │ generate_diagram │                              │
│         └────────┬────────┘                              │
│                  │                                        │
│         ┌────────▼────────┐                              │
│         │   LLM Provider   │   (Azure OpenAI)            │
│         └────────┬────────┘                              │
│                  │                                        │
│         ┌────────▼────────┐                              │
│         │  Cache + Parser  │                              │
│         └─────────────────┘                              │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   AI Flow Frontend                       │
│                                                          │
│  InputForm → API call → DiagramRenderer (React Flow)     │
│                              ↓                           │
│                      ExportButtons (PNG / SVG / DOCX)    │
└──────────────────────────────────────────────────────────┘
```

**Key files:**

| Layer        | File                                  | Purpose                                    |
|-------------|---------------------------------------|--------------------------------------------|
| SDK Facade  | `backend/ai_flow.py`                  | `DiagramGenerator` class — public API      |
| Config      | `backend/app/config.py`               | Env-var + programmatic config (`Config`)   |
| Models      | `backend/app/models.py`               | `DiagramResult`, `DiagramNode`, `DiagramEdge` |
| Service     | `backend/app/services/diagram_service.py` | Orchestrates cache → prompt → LLM → parse |
| LLM         | `backend/app/llm/base.py`             | Abstract `LLMProvider` interface           |
| LLM Impl    | `backend/app/llm/azure_openai_provider.py` | Azure OpenAI implementation           |
| Prompts     | `backend/app/prompts/*.py`            | Type-specific prompt templates             |
| Routes      | `backend/app/api/diagram_routes.py`   | Legacy `/api/diagram/generate`             |
| Routes v1   | `backend/app/api/diagram_routes_v1.py`| `/api/v1/diagram/generate` + batch         |
| Cache       | `backend/app/utils/cache.py`          | In-memory SHA256-based response cache      |
| JSON Parser | `backend/app/utils/json_parser.py`    | LLM response validation                   |

---

## 4. Integration Method 1 — Python SDK

### Installation

```bash
# From local path
pip install /path/to/AI_Flow/backend

# From Git (once pushed to a repo)
pip install git+https://github.com/your-org/AI_Flow.git#subdirectory=backend

# Editable install (for development)
pip install -e /path/to/AI_Flow/backend
```

### Usage

```python
from ai_flow import DiagramGenerator

# Initialize with your own Azure OpenAI credentials
generator = DiagramGenerator({
    "api_key": "your-azure-openai-api-key",
    "endpoint": "https://your-resource.openai.azure.com/",
    "deployment_name": "gpt-4o",
    # optional:
    "api_version": "2024-02-15-preview",
})

# Generate a single diagram
result = generator.generate(
    description="User authentication flow with MFA and password reset",
    diagram_type="process_flow",
)

# Access the result
print(result.nodes)       # list of node dicts
print(result.edges)       # list of edge dicts
print(result.to_dict())   # {"nodes": [...], "edges": [...]}
print(result.to_json())   # JSON string

# Check supported types
print(DiagramGenerator.supported_diagram_types())
# ['decision_tree', 'system_architecture', 'data_flow', 'process_flow']
```

### Use Without Explicit Config (env-var fallback)

If `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, and `AZURE_OPENAI_DEPLOYMENT_NAME` are set in the environment (or in a `.env` file), you can omit the config dict:

```python
generator = DiagramGenerator()  # reads from env vars
result = generator.generate("My system description", "system_architecture")
```

### Embedding Diagrams in a DOCX (Writer Agent Example)

```python
from ai_flow import DiagramGenerator

generator = DiagramGenerator({...})

# Generate multiple diagrams for a validation plan
arch_diagram = generator.generate(
    "CSV system with SAP integration, Oracle DB, and Citrix clients",
    "system_architecture",
)
test_tree = generator.generate(
    "GxP Critical configured system: determine testing strategy based on risk",
    "decision_tree",
)

# Use the nodes/edges data in your DOCX generation logic
# The structure is React Flow-compatible JSON:
for node in arch_diagram.nodes:
    print(f"  Component: {node['data']['label']} (type: {node['type']})")

for edge in arch_diagram.edges:
    print(f"  Connection: {edge['source']} -> {edge['target']} ({edge.get('label', '')})")
```

---

## 5. Integration Method 2 — REST API

### Base URL

Default: `http://localhost:8000`  
Configure via environment variable or reverse proxy for production.

### Endpoints

#### Health Check

```
GET /health
```

Response: `{"status": "ok"}`

---

#### Generate Single Diagram (v1)

```
POST /api/v1/diagram/generate
Content-Type: application/json
X-Request-ID: optional-correlation-id
```

**Request body:**

```json
{
  "description": "Your diagram description here (10-5000 characters)",
  "diagram_type": "decision_tree"
}
```

`diagram_type` is optional, defaults to `"decision_tree"`. Valid values: `decision_tree`, `system_architecture`, `data_flow`, `process_flow`.

**Response (200):**

```json
{
  "nodes": [
    { "id": "node_1", "type": "root", "data": { "label": "Is it GxP?" } },
    { "id": "node_2", "type": "decision", "data": { "label": "Configuration level?" } }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2", "label": "Yes" }
  ],
  "request_id": "your-correlation-id"
}
```

Response header `X-Request-ID` echoes the correlation ID.

**Legacy endpoint** — `POST /api/diagram/generate` still works identically (without `request_id` in body).

---

#### Batch Generate Diagrams (v1)

```
POST /api/v1/diagram/generate-batch
Content-Type: application/json
X-Request-ID: optional-correlation-id
```

**Request body:**

```json
{
  "items": [
    { "description": "System architecture for a CRM platform", "diagram_type": "system_architecture" },
    { "description": "Data flow for order processing", "diagram_type": "data_flow" },
    { "description": "Testing strategy for GxP system", "diagram_type": "decision_tree" }
  ]
}
```

Maximum 10 items per batch.

**Response (200):**

```json
{
  "results": [
    { "nodes": [...], "edges": [...] },
    { "nodes": [...], "edges": [...] },
    { "nodes": [...], "edges": [...] }
  ],
  "request_id": "your-correlation-id"
}
```

If a single item in the batch fails, its entry contains `{"error": "..."}` instead of nodes/edges. Other items still succeed.

---

#### Error Responses

| Status | Meaning                           | Example body                                                   |
|--------|-----------------------------------|----------------------------------------------------------------|
| 422    | Validation error                  | `{"detail": "Missing 'description' field", "request_id": "..."}` |
| 500    | Server / LLM error                | `{"detail": "Failed to generate diagram: ...", "request_id": "..."}` |

---

### cURL Examples

```bash
# Single diagram
curl -X POST http://localhost:8000/api/v1/diagram/generate \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: plan-001-arch" \
  -d '{"description": "Microservices architecture with API gateway", "diagram_type": "system_architecture"}'

# Batch
curl -X POST http://localhost:8000/api/v1/diagram/generate-batch \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: plan-001" \
  -d '{"items": [
    {"description": "Login flow", "diagram_type": "process_flow"},
    {"description": "Data warehouse ETL", "diagram_type": "data_flow"}
  ]}'
```

### Python (requests library)

```python
import requests

BASE_URL = "http://localhost:8000"

# Single
resp = requests.post(
    f"{BASE_URL}/api/v1/diagram/generate",
    json={"description": "My system", "diagram_type": "system_architecture"},
    headers={"X-Request-ID": "writer-plan-42"},
)
data = resp.json()
nodes = data["nodes"]
edges = data["edges"]

# Batch
resp = requests.post(
    f"{BASE_URL}/api/v1/diagram/generate-batch",
    json={"items": [
        {"description": "Auth flow", "diagram_type": "process_flow"},
        {"description": "Risk assessment tree", "diagram_type": "decision_tree"},
    ]},
    headers={"X-Request-ID": "writer-plan-42"},
)
results = resp.json()["results"]
```

---

## 6. Integration Method 3 — React Components

If the consuming project has a React frontend, AI Flow components can be imported directly.

### Installation

```bash
# From local path (npm link or direct reference)
npm install /path/to/AI_Flow/frontend

# Or add to package.json
"dependencies": {
  "ai-flow-frontend": "file:../AI_Flow/frontend"
}
```

### Peer Dependencies

The consuming project must have these installed:

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "reactflow": "^11.10.0",
  "dagre": "^0.8.5"
}
```

### Available Exports

```jsx
import {
  DiagramRenderer,    // Main React Flow diagram component
  InputForm,          // Description + diagram type input form
  LoadingSpinner,     // Loading indicator
  ExportButtons,      // PNG/SVG/DOCX export controls
  getLayoutedElements,// Dagre auto-layout function
  exportAsPng,        // PNG export utility
  exportAsSvg,        // SVG export utility
  exportAsDocx,       // DOCX export utility
  generateDiagram,    // API call utility
} from 'ai-flow-frontend'
```

### DiagramRenderer Props

| Prop          | Type                | Description                              |
|---------------|---------------------|------------------------------------------|
| `nodes`       | `Array<Node>`       | Nodes array from API response            |
| `edges`       | `Array<Edge>`       | Edges array from API response            |
| `diagramType` | `string`            | One of the 4 diagram types (for coloring)|

### Usage Example

```jsx
import { DiagramRenderer, getLayoutedElements } from 'ai-flow-frontend'
import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'

function MyDiagramView({ nodes, edges, diagramType }) {
  const layouted = getLayoutedElements(nodes, edges, 'TB')

  return (
    <ReactFlowProvider>
      <div style={{ height: 600 }}>
        <DiagramRenderer
          nodes={layouted.nodes}
          edges={layouted.edges}
          diagramType={diagramType}
        />
      </div>
    </ReactFlowProvider>
  )
}
```

### Layout Engine

```js
import { getLayoutedElements } from 'ai-flow-frontend'

// Apply dagre auto-layout to raw nodes/edges from API
const { nodes, edges } = getLayoutedElements(rawNodes, rawEdges, 'TB')
// 'TB' = top-to-bottom, 'LR' = left-to-right
```

---

## 7. Data Contracts

### Node Schema

```json
{
  "id": "node_1",
  "type": "decision",
  "data": {
    "label": "Is the system GxP critical?"
  }
}
```

- `id` — Unique string, format `node_N`
- `type` — Depends on diagram type (see table in §2)
- `data.label` — Display text, max ~80 characters

### Edge Schema

```json
{
  "id": "edge_1",
  "source": "node_1",
  "target": "node_2",
  "label": "Yes"
}
```

- `id` — Unique string, format `edge_N`
- `source` / `target` — Must reference existing node IDs
- `label` — Branch condition text or `null` for unconditional connections

### Constraints Per Diagram Type

| Type                  | Min Nodes | Max Nodes | Special Rules                                    |
|-----------------------|-----------|-----------|--------------------------------------------------|
| `decision_tree`       | 3         | 20        | Exactly 1 `root` node                           |
| `system_architecture` | 3         | 25        | —                                                |
| `data_flow`           | 3         | 25        | —                                                |
| `process_flow`        | 4         | 25        | Exactly 1 `start` node, at least 1 `end` node   |

### DiagramResult (Python SDK)

```python
result.nodes         # list[dict] — node objects
result.edges         # list[dict] — edge objects
result.diagram_type  # str — the type that was generated
result.to_dict()     # {"nodes": [...], "edges": [...]}
result.to_json()     # JSON string of above
```

---

## 8. Configuration Reference

### Environment Variables (REST API mode)

| Variable                       | Required | Default                  | Description                        |
|-------------------------------|----------|--------------------------|------------------------------------|
| `AZURE_OPENAI_API_KEY`        | Yes      | —                        | Azure OpenAI API key               |
| `AZURE_OPENAI_ENDPOINT`       | Yes      | —                        | Azure OpenAI endpoint URL          |
| `AZURE_OPENAI_DEPLOYMENT_NAME`| Yes      | —                        | Model deployment name              |
| `AZURE_OPENAI_API_VERSION`    | No       | `2024-02-15-preview`     | API version string                 |
| `CORS_ORIGINS`                | No       | `http://localhost:5173`  | Comma-separated allowed origins    |

### SDK Config Dict Keys

| Key               | Required | Default                  | Maps to env var                   |
|-------------------|----------|--------------------------|------------------------------------|
| `api_key`         | Yes      | —                        | `AZURE_OPENAI_API_KEY`            |
| `endpoint`        | Yes      | —                        | `AZURE_OPENAI_ENDPOINT`           |
| `deployment_name` | Yes      | —                        | `AZURE_OPENAI_DEPLOYMENT_NAME`    |
| `api_version`     | No       | `2024-02-15-preview`     | `AZURE_OPENAI_API_VERSION`        |
| `cors_origins`    | No       | `["http://localhost:5173"]` | `CORS_ORIGINS`                 |

### Frontend Environment

| Variable         | Default                | Description              |
|-----------------|------------------------|--------------------------|
| `VITE_API_URL`  | `http://localhost:8000`| Backend base URL         |

---

## 9. Error Handling

### Python SDK Errors

| Exception      | When                                              | Handling                                    |
|----------------|---------------------------------------------------|---------------------------------------------|
| `ValueError`   | Invalid `diagram_type`, un-parsable LLM response  | Fix input or retry                          |
| `Exception`    | LLM API failure (network, rate limit, auth)        | Retry with backoff                          |

```python
from ai_flow import DiagramGenerator

generator = DiagramGenerator({...})

try:
    result = generator.generate(description, diagram_type)
except ValueError as e:
    # Bad input or LLM returned invalid JSON
    print(f"Validation error: {e}")
except Exception as e:
    # LLM API failure — retry with backoff
    print(f"Generation failed: {e}")
```

### REST API Errors

All error responses include `request_id` (v1 endpoints) for traceability:

```json
{ "detail": "Error message here", "request_id": "abc-123" }
```

### Rate Limiting Awareness

- The backend enforces a **100ms minimum** between LLM requests
- Only **one generation runs at a time** (thread lock)
- The LLM provider retries once on 429 errors with exponential backoff
- For batch requests, items are processed sequentially within the lock
- If your writer agent sends many concurrent requests, they queue — they won't fail, but throughput is throttled

**Recommendation:** Use the batch endpoint (`/api/v1/diagram/generate-batch`) to send up to 10 diagrams at once rather than making concurrent single requests.

---

## 10. Example: Writer Agent Integration Scenario

Here is a step-by-step example of how a **Validation Plans Writer Agent** would integrate with AI Flow to produce a validation plan document with embedded diagrams.

### Scenario

The writer agent drafts a Computer System Validation (CSV) plan for a GxP-regulated system. The plan needs:
1. A **system architecture diagram** showing all components
2. A **decision tree** for the testing strategy (risk-based)
3. A **process flow** for the validation lifecycle

### Step 1: Install AI Flow

```bash
pip install /path/to/AI_Flow/backend
```

### Step 2: Generate Diagrams in the Writer Agent

```python
# writer_agent/plan_generator.py

from ai_flow import DiagramGenerator

class PlanGenerator:
    def __init__(self, azure_config: dict):
        self.diagram_gen = DiagramGenerator(azure_config)

    def generate_plan(self, system_description: str) -> dict:
        """Generate a complete validation plan with diagrams."""

        # Generate all diagrams for this plan
        architecture = self.diagram_gen.generate(
            description=f"System architecture for: {system_description}",
            diagram_type="system_architecture",
        )

        testing_strategy = self.diagram_gen.generate(
            description=(
                f"CSV testing strategy decision tree for: {system_description}. "
                "Consider GxP criticality, configuration vs OOTB, and risk levels."
            ),
            diagram_type="decision_tree",
        )

        validation_lifecycle = self.diagram_gen.generate(
            description=(
                f"Validation lifecycle process flow for: {system_description}. "
                "Include planning, requirements, testing, deployment, and review."
            ),
            diagram_type="process_flow",
        )

        return {
            "system_description": system_description,
            "diagrams": {
                "architecture": architecture.to_dict(),
                "testing_strategy": testing_strategy.to_dict(),
                "validation_lifecycle": validation_lifecycle.to_dict(),
            },
            # ... other plan sections (scope, risk assessment, etc.)
        }
```

### Step 3: Embed in Document

The writer agent uses the `nodes`/`edges` JSON to:
- Render diagrams in a frontend (via React components)
- Store them alongside the plan for later viewing
- Convert to images server-side (using a rendering library) for DOCX embedding

### Alternative: REST API Approach

If the writer agent is in a different language or isolated network:

```python
import requests

class PlanGenerator:
    def __init__(self, ai_flow_url="http://localhost:8000"):
        self.base_url = ai_flow_url

    def generate_plan(self, system_description: str, plan_id: str) -> dict:
        # Use batch endpoint for efficiency
        resp = requests.post(
            f"{self.base_url}/api/v1/diagram/generate-batch",
            json={"items": [
                {
                    "description": f"System architecture for: {system_description}",
                    "diagram_type": "system_architecture",
                },
                {
                    "description": f"CSV testing strategy for: {system_description}",
                    "diagram_type": "decision_tree",
                },
                {
                    "description": f"Validation lifecycle for: {system_description}",
                    "diagram_type": "process_flow",
                },
            ]},
            headers={"X-Request-ID": f"plan-{plan_id}"},
        )
        resp.raise_for_status()

        data = resp.json()
        arch, testing, lifecycle = data["results"]

        return {
            "system_description": system_description,
            "diagrams": {
                "architecture": arch,
                "testing_strategy": testing,
                "validation_lifecycle": lifecycle,
            },
        }
```

---

## Running AI Flow Standalone

For local development and testing:

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate       # Windows
pip install -r requirements.txt
# Configure .env with Azure OpenAI credentials
python run.py                  # Starts on port 8000

# Frontend (optional — only needed for visual rendering)
cd frontend
npm install
npm run dev                    # Starts on port 5173
```

**Health check:** `curl http://localhost:8000/health`

**Swagger docs:** `http://localhost:8000/apidocs/`
