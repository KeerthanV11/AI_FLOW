"""
Data Flow Diagram Prompt Template

Constructs the prompt sent to the LLM to generate structured JSON
from natural language data flow descriptions.
"""


def get_prompt(description: str) -> str:
    return f"""You are a Data Flow Diagram to JSON converter. Your task is to convert a natural language data flow description into a valid JSON structure that can be rendered as a flowchart diagram.

User's Data Flow Description:
"{description}"

Task:
1. Analyze the description and identify:
   - External entities (users, systems that interact with the system)
   - Processes (actions that transform or move data)
   - Data stores (databases, files, repositories where data is stored)

2. Create a graph structure showing how data flows between these components.

3. Return ONLY a valid, compact JSON object. Do NOT include markdown formatting, code blocks, explanations, or any text outside the JSON. Return the raw JSON only.

Output Format:
{{
  "nodes": [
    {{"id": "node_1", "type": "external_entity", "data": {{"label": "Customer"}}}},
    {{"id": "node_2", "type": "process", "data": {{"label": "Process Order"}}}},
    {{"id": "node_3", "type": "data_store", "data": {{"label": "Orders Database"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Order details"}},
    {{"id": "edge_2", "source": "node_2", "target": "node_3", "label": "Store order"}}
  ]
}}

Node Types:
- "external_entity" — users, external systems, or actors outside the system boundary
- "process" — actions that transform, validate, route, or process data
- "data_store" — databases, file systems, caches, or any persistent storage

Rules:
- Node IDs must be unique and follow pattern: node_1, node_2, node_3, etc.
- Edge IDs must be unique and follow pattern: edge_1, edge_2, edge_3, etc.
- All node IDs referenced in edges must exist in the nodes array
- Node labels should be concise (max 80 characters)
- Edge labels should describe what data flows along that path (e.g., "Order details", "Payment confirmation", "User credentials") or be null
- Include at least 3 nodes and 2 edges
- Maximum 25 nodes
- Every edge must connect valid source and target nodes
- Return ONLY the JSON object, no markdown formatting, no explanations

Example Input:
"A customer submits an order. The order system validates it, stores it in the database, and sends a confirmation email."

Example Output:
{{
  "nodes": [
    {{"id": "node_1", "type": "external_entity", "data": {{"label": "Customer"}}}},
    {{"id": "node_2", "type": "process", "data": {{"label": "Validate Order"}}}},
    {{"id": "node_3", "type": "data_store", "data": {{"label": "Orders Database"}}}},
    {{"id": "node_4", "type": "process", "data": {{"label": "Send Confirmation"}}}},
    {{"id": "node_5", "type": "external_entity", "data": {{"label": "Email Service"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Order details"}},
    {{"id": "edge_2", "source": "node_2", "target": "node_3", "label": "Valid order"}},
    {{"id": "edge_3", "source": "node_2", "target": "node_4", "label": "Order confirmed"}},
    {{"id": "edge_4", "source": "node_4", "target": "node_5", "label": "Email request"}}
  ]
}}

Now generate the JSON for the user's description. Remember: ONLY return the JSON object, nothing else."""
