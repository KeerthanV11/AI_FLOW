# PROMPT_ENGINEERING.md — LLM Prompt Design & JSON Schema

## Overview

The prompt is the core of the application — it instructs Google's Gemini 2.0 Flash to convert a user's natural language decision tree description into structured JSON that React Flow can render. This document defines the exact prompt template, JSON schema, node types, and best practices for tuning.

---

## Prompt Design Strategy

**Goals**:
1. Instruct Gemini to return **ONLY valid JSON** (no markdown, no extra text)
2. Specify exact JSON **schema** with field types and constraints
3. Provide **examples** to guide the model
4. Request **vertical layout** positioning (dagre will override, but helps)
5. Handle **edge cases** (circular references, disconnected nodes, etc.)

**Key Technique**:
- Use `response_mime_type="application/json"` in the API call for guaranteed structured output
- Be explicit: "Return ONLY..." and "Do NOT include..."
- Show examples with correct formatting

---

## JSON Schema Specification

### Request

```json
{
  "description": "Should I go outside? If it's raining, stay inside. If it's sunny, go to the park. At the park, if it's crowded, go to the beach, otherwise stay in the park."
}
```

### Response

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "root",
      "data": {
        "label": "Should I go outside?"
      }
    },
    {
      "id": "node_2",
      "type": "decision",
      "data": {
        "label": "Is it raining?"
      }
    },
    {
      "id": "node_3",
      "type": "outcome",
      "data": {
        "label": "Stay inside"
      }
    },
    {
      "id": "node_4",
      "type": "outcome",
      "data": {
        "label": "Go to park"
      }
    },
    {
      "id": "node_5",
      "type": "decision",
      "data": {
        "label": "Is it crowded?"
      }
    },
    {
      "id": "node_6",
      "type": "outcome",
      "data": {
        "label": "Go to beach"
      }
    },
    {
      "id": "node_7",
      "type": "outcome",
      "data": {
        "label": "Stay in park"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": null
    },
    {
      "id": "edge_2",
      "source": "node_2",
      "target": "node_3",
      "label": "Yes, raining"
    },
    {
      "id": "edge_3",
      "source": "node_2",
      "target": "node_4",
      "label": "No, sunny"
    },
    {
      "id": "edge_4",
      "source": "node_4",
      "target": "node_5",
      "label": null
    },
    {
      "id": "edge_5",
      "source": "node_5",
      "target": "node_6",
      "label": "Yes, crowded"
    },
    {
      "id": "edge_6",
      "source": "node_5",
      "target": "node_7",
      "label": "No, not crowded"
    }
  ]
}
```

### Field Specifications

#### Nodes

```
nodes: array[Node]

Node = {
  id: string,              # Unique identifier (e.g., "node_1", "node_2")
  type: string,            # One of: "root", "decision", "outcome"
  data: {
    label: string          # Display text (max 80 chars, concise)
  }
}
```

**Node Types**:

| Type | Description | Example |
|------|-------------|---------|
| `root` | Entry point / initial question | "Should I go outside?" |
| `decision` | Question or condition to evaluate | "Is it raining?" |
| `outcome` | Result, conclusion, or action | "Stay inside", "Go to park" |

**Constraints**:
- `id` must be unique within the nodes array
- `id` format: `node_<number>` (e.g., node_1, node_2, node_50)
- `label` must be **concise** (10-80 chars recommended)
- Exactly one node should have `type: "root"`
- Most nodes should be either `decision` or `outcome`

---

#### Edges

```
edges: array[Edge]

Edge = {
  id: string,              # Unique identifier (e.g., "edge_1")
  source: string,          # Source node ID (must exist in nodes)
  target: string,          # Target node ID (must exist in nodes)
  label: string | null     # Branch condition (optional, can be null)
}
```

**Constraints**:
- `id` must be unique within the edges array
- `id` format: `edge_<number>` (e.g., edge_1, edge_2)
- `source` and `target` must reference valid node IDs
- `label` should describe the condition/branch if possible (e.g., "Yes", "No", "Raining", "Sunny")
- `label` can be `null` if no clear condition

**Common label patterns**:
- Boolean: "Yes", "No"
- Conditions: "True", "False", "If condition X", "Otherwise"
- Outcomes: "Raining", "Sunny", "Hot", "Cold"

---

## Prompt Template

**Location**: `backend/prompts/decision_tree.py`

**Function**: `get_prompt(description: str) -> str`

**Template**:

```python
def get_prompt(description: str) -> str:
    return f"""You are a Decision Tree to JSON converter. Your task is to convert a natural language decision tree description into a valid JSON structure that can be rendered as a flowchart.

User's Decision Tree Description:
"{description}"

Task:
1. Analyze the description and identify:
   - The root/entry point (starting question)
   - Intermediate decisions (yes/no questions, conditions)
   - Final outcomes (results, conclusions, actions)

2. Create a tree structure with these nodes and edges.

3. Return ONLY a valid, compact JSON object. Do NOT include markdown formatting, code blocks, or any text outside the JSON.

Output Format:
{{
  "nodes": [
    {{"id": "node_1", "type": "root", "data": {{"label": "Entry point question"}}}},
    {{"id": "node_2", "type": "decision", "data": {{"label": "A yes/no question"}}}},
    {{"id": "node_3", "type": "outcome", "data": {{"label": "A result or action"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": null}},
    {{"id": "edge_2", "source": "node_2", "target": "node_3", "label": "Yes"}}
  ]
}}

Rules:
- There must be exactly ONE root node (type: "root")
- Node IDs must be unique and follow pattern: node_1, node_2, node_3, etc.
- Edge IDs must be unique and follow pattern: edge_1, edge_2, edge_3, etc.
- All node IDs in edges must exist in the nodes array
- Node labels should be concise (max 80 characters)
- Edge labels should describe the branch condition (e.g., "Yes", "No", "True", "False") or be null
- Include at least 3 nodes and 2 edges
- Maximum 15 nodes (keep trees reasonably sized)
- Return ONLY the JSON object, no markdown, no explanations

Example Input:
"Should I take an umbrella? If it's raining, yes. If it's sunny, no."

Example Output:
{{
  "nodes": [
    {{"id": "node_1", "type": "root", "data": {{"label": "Should I take umbrella?"}}}},
    {{"id": "node_2", "type": "outcome", "data": {{"label": "Yes, take umbrella"}}}},
    {{"id": "node_3", "type": "outcome", "data": {{"label": "No umbrella needed"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Raining"}},
    {{"id": "edge_2", "source": "node_1", "target": "node_3", "label": "Sunny"}}
  ]
}}

Now generate the JSON for the user's description."""
```

---

## Integration with Backend

**In `backend/services/gemini_service.py`**:

```python
import google.generativeai as genai
from config import GOOGLE_API_KEY, GEMINI_MODEL
from prompts.decision_tree import get_prompt

def generate_tree_from_description(description: str) -> str:
    """
    Sends description to Gemini with structured prompt.
    Returns raw LLM response (string containing JSON).
    """
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    
    prompt = get_prompt(description)
    
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
    )
    
    return response.text
```

**Key**: `response_mime_type="application/json"` tells Gemini to return structured JSON only.

---

## Example I/O Pairs

### Example 1: Simple Binary Tree

**Input**:
```
Should I go swimming? If it's hot, yes. If it's cold, no.
```

**Output**:
```json
{
  "nodes": [
    {"id": "node_1", "type": "root", "data": {"label": "Should I go swimming?"}},
    {"id": "node_2", "type": "outcome", "data": {"label": "Yes, go swimming"}},
    {"id": "node_3", "type": "outcome", "data": {"label": "No, stay dry"}}
  ],
  "edges": [
    {"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Hot"},
    {"id": "edge_2", "source": "node_1", "target": "node_3", "label": "Cold"}
  ]
}
```

### Example 2: Multi-Level Tree

**Input**:
```
Should I buy a new laptop? If I have enough money, check if the current one is broken. If broken, buy it. If not broken, wait. If I don't have money, work to save.
```

**Output**:
```json
{
  "nodes": [
    {"id": "node_1", "type": "root", "data": {"label": "Should I buy a new laptop?"}},
    {"id": "node_2", "type": "decision", "data": {"label": "Do I have enough money?"}},
    {"id": "node_3", "type": "decision", "data": {"label": "Is current one broken?"}},
    {"id": "node_4", "type": "outcome", "data": {"label": "Buy new laptop"}},
    {"id": "node_5", "type": "outcome", "data": {"label": "Keep current laptop"}},
    {"id": "node_6", "type": "outcome", "data": {"label": "Work to save money"}}
  ],
  "edges": [
    {"id": "edge_1", "source": "node_1", "target": "node_2", "label": null},
    {"id": "edge_2", "source": "node_2", "target": "node_3", "label": "Yes"},
    {"id": "edge_3", "source": "node_3", "target": "node_4", "label": "Yes"},
    {"id": "edge_4", "source": "node_3", "target": "node_5", "label": "No"},
    {"id": "edge_5", "source": "node_2", "target": "node_6", "label": "No"}
  ]
}
```

---

## Tuning & Best Practices

### To Improve Output Quality

1. **Be More Specific**:
   - Add constraints: "Maximum 5 nodes", "Maximum 2 levels deep"
   - Request specific edge label formats: "Use only 'Yes'/'No' labels, or null"
   - Specify label length: "Node labels must be 10-50 characters"

2. **Provide More Examples**:
   - Show complex trees, not just simple ones
   - Show edge cases (circular? disconnected?)
   - Show exactly what you DON'T want

3. **Clarify Node Types**:
   - "root = the starting question that must match the input description"
   - "decision = intermediate questions the user must answer"
   - "outcome = final results or actions"

4. **Add Validation Rules**:
   - "Every node except outcomes must have at least one outgoing edge"
   - "Every node except root must have exactly one incoming edge"
   - "Nodes must form a tree (no cycles)"

### If Output is Invalid

1. **Check JSON syntax** — ensure response is valid JSON (use `json.loads()`)
2. **Validate schema** — ensure nodes, edges arrays exist and have correct fields
3. **Retry on failure** — send request again with stricter prompt
4. **Log errors** — save failed responses for debugging

**Example retry logic**:
```python
def generate_with_retry(description, retries=2):
    for attempt in range(retries):
        try:
            raw = generate_tree_from_description(description)
            data = json.loads(raw)
            validate_schema(data)  # Your validation function
            return data
        except (json.JSONDecodeError, ValueError) as e:
            if attempt == retries - 1:
                raise
            # Retry with stricter prompt
            description = description[:500]  # Truncate if too long
    return None
```

### Model Selection

**gemini-2.0-flash** (current choice):
- ✅ Fast (good for interactive use)
- ✅ Structured output support (`response_mime_type`)
- ✅ Cost-effective
- ⚠️ Smaller context window than pro models

**gemini-1.5-pro** (if needed):
- ✅ Better quality
- ✅ Larger context window (up to 1M tokens)
- Slower
- More expensive

Switch in `backend/.env`:
```
GEMINI_MODEL=gemini-1.5-pro
```

---

## Common Prompt Issues & Fixes

### Issue: Model returns markdown-fenced JSON
**Fix**: Add "Do NOT include markdown formatting" to prompt

### Issue: Model returns extra explanations after JSON
**Fix**: Add "Return ONLY the JSON object, no explanations"

### Issue: Node labels are too long
**Fix**: Add "Node labels must be max 50 characters"

### Issue: Edge labels inconsistent
**Fix**: Specify labels: "Use 'Yes'/'No' or null, always lowercase"

### Issue: Tree is too deep/wide
**Fix**: Add "Maximum X nodes", "Maximum Y levels deep"

### Issue: Circular references or disconnected nodes
**Fix**: Add "Ensure all nodes form a single connected tree with root as entry point"

---

## Schema Validation (Backend)

**In `backend/utils/json_parser.py`**:

```python
import json
from pydantic import ValidationError
from models.schemas import GenerateResponse

def validate_tree_schema(data: dict) -> GenerateResponse:
    """
    Validate parsed JSON against Pydantic schema.
    Raises ValidationError if invalid.
    """
    # Pydantic will validate structure + types
    response = GenerateResponse(**data)
    
    # Additional validation
    node_ids = {n.id for n in response.nodes}
    root_count = sum(1 for n in response.nodes if n.type == "root")
    
    assert root_count == 1, "Must have exactly one root node"
    
    for edge in response.edges:
        assert edge.source in node_ids, f"Edge references invalid source: {edge.source}"
        assert edge.target in node_ids, f"Edge references invalid target: {edge.target}"
    
    return response
```

---

## Further Considerations

1. **Rate Limiting**: If users submit many requests, implement backend rate limiting (e.g., 10 requests/min per IP)
2. **Caching**: Cache identical descriptions to avoid repeated Gemini calls
3. **Feedback Loop**: Let users rate diagram quality, use feedback to improve prompts
4. **Customization**: Allow users to configure node/edge styles or depth limits
5. **Debugging**: Add `/api/debug/prompt` endpoint that shows the prompt and raw response for troubleshooting
