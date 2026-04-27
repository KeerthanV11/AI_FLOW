# API_CONTRACT.md — API Endpoint Specifications

## Overview

This document defines the complete API contract for the Decision Tree Generator backend. All requests and responses use JSON format with proper HTTP status codes.

---

## Base URL

```
http://localhost:8000
```

For production, replace with your deployment URL.

---

## Endpoints

### 1. Health Check

**Endpoint**: `GET /health`

**Purpose**: Verify the backend service is running.

**Request**:
```bash
curl http://localhost:8000/health
```

**Response** (200 OK):
```json
{
  "status": "ok"
}
```

**Error Cases**: None (endpoint always succeeds if service is running)

---

### 2. Generate Decision Tree Diagram

**Endpoint**: `POST /api/generate`

**Purpose**: Convert a natural language decision tree description into structured JSON (nodes and edges).

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "description": "Should I go outside? If it's raining, stay inside. If it's sunny, go to the park."
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `description` | string | ✓ | Min: 10 chars, Max: 5000 chars | Natural language description of the decision tree |

**Example Requests**:

```bash
# Example 1: Simple tree
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Should I take an umbrella? If raining, yes. If sunny, no."
  }'

# Example 2: Complex tree
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Hardware decision tree: Start with a budget check. If under $500, recommend budget laptop. If $500-$1000, check performance needs: gaming = gaming laptop, work = ultrabook. If over $1000, recommend premium laptop."
  }'

# Using jq to format output
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "..."}' | jq .
```

#### Response

**Success** (200 OK):
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
    }
  ]
}
```

**Response Field Specifications**:

```
GenerateResponse = {
  nodes: array[Node],
  edges: array[Edge]
}

Node = {
  id: string,              # Unique node identifier (e.g., "node_1")
  type: string,            # One of: "root", "decision", "outcome"
  data: {
    label: string          # Display text (max 80 chars)
  }
}

Edge = {
  id: string,              # Unique edge identifier (e.g., "edge_1")
  source: string,          # Source node ID (must exist in nodes)
  target: string,          # Target node ID (must exist in nodes)
  label: string | null     # Branch condition or null
}
```

#### Error Responses

**400 Bad Request**:
```json
{
  "detail": "Invalid request format"
}
```
- Occurs when request body is malformed (not valid JSON)

**422 Unprocessable Entity** (Validation Error):
```json
{
  "detail": [
    {
      "loc": ["body", "description"],
      "msg": "ensure this value has at least 10 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

| Error | Cause | Solution |
|-------|-------|----------|
| `ensure this value has at least 10 characters` | Description too short | Provide at least 10 characters |
| `ensure this value has at most 5000 characters` | Description too long | Keep description under 5000 chars |
| `field required` | Missing `description` field | Add `description` to request body |

**500 Internal Server Error**:
```json
{
  "detail": "Failed to parse LLM response: Invalid JSON from model"
}
```

| Error | Cause | Solution |
|-------|-------|----------|
| `GOOGLE_API_KEY not set` | Missing API key in `.env` | Set `GOOGLE_API_KEY` in `backend/.env` |
| `Failed to parse LLM response` | LLM returned invalid JSON | Retry request, check `.env` configuration |
| `API call to Gemini failed` | Network or quota issue | Check Google Cloud quota, retry later |

---

## Rate Limiting (Future)

Not currently implemented, but recommended for production:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1702000000
```

---

## CORS Headers

The backend includes CORS headers to allow requests from the frontend:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Configurable in**: `backend/.env` via `CORS_ORIGINS`

---

## Response Time

- **Typical**: 2-5 seconds (most of the time spent waiting for Gemini API)
- **Slow**: 5-10 seconds (if Gemini is slow)
- **Timeout**: No built-in timeout; client should implement 30-second timeout

---

## Testing Commands

### Test with `curl`

```bash
# Health check
curl http://localhost:8000/health

# Simple tree
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "Should I take umbrella? If raining yes, if sunny no."}'

# Validation error (too short)
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "short"}'

# Missing field
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test with Python

```python
import requests

url = "http://localhost:8000/api/generate"
payload = {
    "description": "Should I go outside? If it's raining, stay inside. If it's sunny, go to the park."
}

response = requests.post(url, json=payload)
print(response.status_code)
print(response.json())
```

### Test with JavaScript/Fetch

```javascript
const url = "http://localhost:8000/api/generate";
const payload = {
    description: "Should I go outside? If it's raining, stay inside. If it's sunny, go to the park."
};

fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

---

## Request/Response Examples

### Example 1: Customer Support Decision Tree

**Request**:
```json
{
  "description": "Customer support decision: Start by asking if they have an account. If yes, ask if the issue is billing. If billing, offer refund or payment plan. If not billing, offer tech support. If no account, ask if they want to create one. If yes, walk through signup. If no, provide general help."
}
```

**Response**:
```json
{
  "nodes": [
    {"id": "node_1", "type": "root", "data": {"label": "Do you have an account?"}},
    {"id": "node_2", "type": "decision", "data": {"label": "Is the issue billing?"}},
    {"id": "node_3", "type": "outcome", "data": {"label": "Offer refund"}},
    {"id": "node_4", "type": "outcome", "data": {"label": "Payment plan"}},
    {"id": "node_5", "type": "outcome", "data": {"label": "Tech support"}},
    {"id": "node_6", "type": "decision", "data": {"label": "Create account?"}},
    {"id": "node_7", "type": "outcome", "data": {"label": "Start signup"}},
    {"id": "node_8", "type": "outcome", "data": {"label": "General help"}}
  ],
  "edges": [
    {"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Yes"},
    {"id": "edge_2", "source": "node_2", "target": "node_3", "label": "Yes"},
    {"id": "edge_3", "source": "node_2", "target": "node_5", "label": "No"},
    {"id": "edge_4", "source": "node_1", "target": "node_6", "label": "No"},
    {"id": "edge_5", "source": "node_6", "target": "node_7", "label": "Yes"},
    {"id": "edge_6", "source": "node_6", "target": "node_8", "label": "No"}
  ]
}
```

### Example 2: Medical Decision Tree (Hypothetical)

**Request**:
```json
{
  "description": "Patient symptoms: If fever and cough, check if shortness of breath. If yes, suspect pneumonia, refer to ER. If no, likely cold, rest at home. If no fever but has cough, check if chest pain. If yes, chest X-ray needed. If no, likely mild cough, monitor."
}
```

**Response**:
```json
{
  "nodes": [
    {"id": "node_1", "type": "root", "data": {"label": "Patient has fever?"}},
    {"id": "node_2", "type": "decision", "data": {"label": "Has cough?"}},
    {"id": "node_3", "type": "decision", "data": {"label": "Shortness of breath?"}},
    {"id": "node_4", "type": "outcome", "data": {"label": "Refer to ER"}},
    {"id": "node_5", "type": "outcome", "data": {"label": "Rest at home"}},
    {"id": "node_6", "type": "decision", "data": {"label": "Chest pain?"}},
    {"id": "node_7", "type": "outcome", "data": {"label": "Chest X-ray"}},
    {"id": "node_8", "type": "outcome", "data": {"label": "Monitor, rest"}}
  ],
  "edges": [
    {"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Yes"},
    {"id": "edge_2", "source": "node_2", "target": "node_3", "label": "Yes"},
    {"id": "edge_3", "source": "node_3", "target": "node_4", "label": "Yes"},
    {"id": "edge_4", "source": "node_3", "target": "node_5", "label": "No"},
    {"id": "edge_5", "source": "node_1", "target": "node_6", "label": "No"},
    {"id": "edge_6", "source": "node_6", "target": "node_7", "label": "Yes"},
    {"id": "edge_7", "source": "node_6", "target": "node_8", "label": "No"}
  ]
}
```

---

## Status Codes Reference

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded, response contains generated tree |
| 400 | Bad Request | Request format is invalid (malformed JSON) |
| 422 | Unprocessable Entity | Request validation failed (invalid field values) |
| 500 | Internal Server Error | Server error (API key missing, LLM failed, etc.) |
| 503 | Service Unavailable | Backend is down or Gemini API is unreachable |

---

## Best Practices for Clients

1. **Always include Content-Type header**: `"Content-Type": "application/json"`
2. **Validate description length**: Enforce 10-5000 character limit on client side for better UX
3. **Implement timeout**: Set 30-second timeout on client requests
4. **Handle errors gracefully**: Show user-friendly error messages
5. **Retry on failure**: Retry 500 errors with exponential backoff
6. **Cache responses**: Don't submit identical descriptions multiple times
7. **Log responses**: Save successful responses for debugging and analytics

---

## Future API Enhancements

1. **`GET /api/templates`** — List pre-built diagram templates
2. **`POST /api/validate`** — Validate user-provided JSON tree structure
3. **`POST /api/export`** — Server-side export to PNG/SVG (instead of client-side)
4. **`GET /api/history`** — Retrieve previous generated diagrams
5. **`PUT /api/diagram/{id}`** — Update and re-save a diagram
6. **`DELETE /api/diagram/{id}`** — Delete a saved diagram
7. **Rate limiting headers** — `X-RateLimit-*` headers in responses
8. **Webhook support** — Notify external services when diagram is generated

---

## Versioning

Currently on **API v1**. Future versions will maintain backward compatibility or provide migration guides.

For future versions:
```
POST /api/v2/generate  (new version)
POST /api/v1/generate  (kept for compatibility)
```
