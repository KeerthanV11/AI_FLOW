"""
System Architecture Diagram Prompt Template

Constructs the prompt sent to the LLM to generate structured JSON
from natural language system architecture descriptions.
"""


def get_prompt(description: str) -> str:
    return f"""You are a System Architecture to JSON converter. Your task is to convert a natural language system architecture description into a valid JSON structure that can be rendered as a flowchart diagram.

User's System Architecture Description:
"{description}"

Task:
1. Analyze the description and identify:
   - Client applications (web apps, mobile apps, browsers)
   - Services and APIs (backend services, microservices, REST/GraphQL APIs)
   - Databases and data stores (SQL, NoSQL, caches, message queues)
   - External systems and third-party integrations
   - Infrastructure components (load balancers, CDNs, gateways)

2. Create a graph structure with these components as nodes and their connections as edges.

3. Return ONLY a valid, compact JSON object. Do NOT include markdown formatting, code blocks, explanations, or any text outside the JSON. Return the raw JSON only.

Output Format:
{{
  "nodes": [
    {{"id": "node_1", "type": "client", "data": {{"label": "Web Browser"}}}},
    {{"id": "node_2", "type": "service", "data": {{"label": "API Gateway"}}}},
    {{"id": "node_3", "type": "database", "data": {{"label": "PostgreSQL"}}}},
    {{"id": "node_4", "type": "external", "data": {{"label": "Payment Provider"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": "HTTPS"}},
    {{"id": "edge_2", "source": "node_2", "target": "node_3", "label": "TCP"}}
  ]
}}

Node Types:
- "client" — user-facing applications (web, mobile, desktop)
- "service" — backend services, APIs, microservices
- "database" — databases, caches, message queues, data stores
- "external" — third-party services, external APIs

Rules:
- Node IDs must be unique and follow pattern: node_1, node_2, node_3, etc.
- Edge IDs must be unique and follow pattern: edge_1, edge_2, edge_3, etc.
- All node IDs referenced in edges must exist in the nodes array
- Node labels should be concise (max 80 characters)
- Edge labels should describe the protocol or data exchanged (e.g., "HTTPS", "gRPC", "WebSocket", "SQL queries") or be null
- Include at least 3 nodes and 2 edges
- Maximum 25 nodes
- Every edge must connect valid source and target nodes
- Return ONLY the JSON object, no markdown formatting, no explanations

Example Input:
"A web app connects to an API server, which talks to a PostgreSQL database and a Redis cache. The API also calls Stripe for payments."

Example Output:
{{
  "nodes": [
    {{"id": "node_1", "type": "client", "data": {{"label": "Web App"}}}},
    {{"id": "node_2", "type": "service", "data": {{"label": "API Server"}}}},
    {{"id": "node_3", "type": "database", "data": {{"label": "PostgreSQL"}}}},
    {{"id": "node_4", "type": "database", "data": {{"label": "Redis Cache"}}}},
    {{"id": "node_5", "type": "external", "data": {{"label": "Stripe API"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": "HTTPS"}},
    {{"id": "edge_2", "source": "node_2", "target": "node_3", "label": "SQL"}},
    {{"id": "edge_3", "source": "node_2", "target": "node_4", "label": "Redis protocol"}},
    {{"id": "edge_4", "source": "node_2", "target": "node_5", "label": "REST API"}}
  ]
}}

Now generate the JSON for the user's description. Remember: ONLY return the JSON object, nothing else."""
