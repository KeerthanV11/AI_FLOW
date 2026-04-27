"""
Process Flow Diagram Prompt Template

Constructs the prompt sent to the LLM to generate structured JSON
from natural language process flow descriptions.
"""


def get_prompt(description: str) -> str:
    return f"""You are a Process Flow Diagram to JSON converter. Your task is to convert a natural language process description into a valid JSON structure that can be rendered as a flowchart diagram.

User's Process Flow Description:
"{description}"

Task:
1. Analyze the description and identify:
   - Start point (where the process begins)
   - Process steps (actions, tasks, operations)
   - Decision points (conditions that branch the flow)
   - End points (where the process concludes)

2. Create a flowchart structure showing the sequence of steps, decisions, and outcomes.

3. Return ONLY a valid, compact JSON object. Do NOT include markdown formatting, code blocks, explanations, or any text outside the JSON. Return the raw JSON only.

Output Format:
{{
  "nodes": [
    {{"id": "node_1", "type": "start", "data": {{"label": "Start"}}}},
    {{"id": "node_2", "type": "process", "data": {{"label": "Review Application"}}}},
    {{"id": "node_3", "type": "decision", "data": {{"label": "Approved?"}}}},
    {{"id": "node_4", "type": "end", "data": {{"label": "Done"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": null}},
    {{"id": "edge_2", "source": "node_2", "target": "node_3", "label": null}},
    {{"id": "edge_3", "source": "node_3", "target": "node_4", "label": "Yes"}}
  ]
}}

Node Types:
- "start" — the entry point of the process (exactly one)
- "process" — an action, task, or operation step
- "decision" — a condition or question that branches the flow
- "end" — a terminal point where a branch of the process concludes

Rules:
- There must be exactly ONE start node (type: "start")
- There must be at least ONE end node (type: "end")
- Node IDs must be unique and follow pattern: node_1, node_2, node_3, etc.
- Edge IDs must be unique and follow pattern: edge_1, edge_2, edge_3, etc.
- All node IDs referenced in edges must exist in the nodes array
- Node labels should be concise (max 80 characters)
- Edge labels should describe the condition for decision branches (e.g., "Yes", "No", "Approved", "Rejected") or be null for sequential steps
- Include at least 4 nodes and 3 edges
- Maximum 25 nodes
- Every edge must connect valid source and target nodes
- Return ONLY the JSON object, no markdown formatting, no explanations

Example Input:
"Employee submits expense report. Manager reviews it. If approved, finance processes payment. If rejected, employee revises and resubmits."

Example Output:
{{
  "nodes": [
    {{"id": "node_1", "type": "start", "data": {{"label": "Start"}}}},
    {{"id": "node_2", "type": "process", "data": {{"label": "Submit Expense Report"}}}},
    {{"id": "node_3", "type": "process", "data": {{"label": "Manager Review"}}}},
    {{"id": "node_4", "type": "decision", "data": {{"label": "Approved?"}}}},
    {{"id": "node_5", "type": "process", "data": {{"label": "Process Payment"}}}},
    {{"id": "node_6", "type": "process", "data": {{"label": "Revise Report"}}}},
    {{"id": "node_7", "type": "end", "data": {{"label": "Payment Complete"}}}},
    {{"id": "node_8", "type": "end", "data": {{"label": "Resubmitted"}}}}
  ],
  "edges": [
    {{"id": "edge_1", "source": "node_1", "target": "node_2", "label": null}},
    {{"id": "edge_2", "source": "node_2", "target": "node_3", "label": null}},
    {{"id": "edge_3", "source": "node_3", "target": "node_4", "label": null}},
    {{"id": "edge_4", "source": "node_4", "target": "node_5", "label": "Approved"}},
    {{"id": "edge_5", "source": "node_4", "target": "node_6", "label": "Rejected"}},
    {{"id": "edge_6", "source": "node_5", "target": "node_7", "label": null}},
    {{"id": "edge_7", "source": "node_6", "target": "node_8", "label": null}}
  ]
}}

Now generate the JSON for the user's description. Remember: ONLY return the JSON object, nothing else."""
