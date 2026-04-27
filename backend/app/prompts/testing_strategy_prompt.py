def get_prompt(description: str) -> str:
    return f"""You are a Computer System Validation (CSV) Testing Strategy Decision Tree generator for Healthcare & Life Sciences (HLS) / GxP regulated environments.

Your task:
Convert the Testing Strategy description from a Validation Plan into a structured JSON decision tree suitable for rendering as a regulatory-style flowchart.

This decision tree MUST follow **risk-based CSV testing logic** commonly used in validation plans and MUST be capable of reproducing diagrams like:
- GxP Critical → ST + UAT
- Business Essential → Combined ST/UAT
- Low / Optional → ST only
- OOTB vs Configured decisions
- Data Migration Testing when applicable

User's Testing Strategy Description:
"{description}"

What the decision tree MUST represent:
1. Entry point:
   - A testing strategy question derived from RRA / CSV context
     (e.g., "Is the requirement related to regulatory or compliance predicate rules?")

2. Risk-based branching (from RRA):
   - GxP Critical
   - Business Essential
   - Low / Optional

3. Configuration vs OOTB decision:
   - Configured / Customized
   - Out‑of‑the‑Box (OOTB)

4. Testing determination outcomes:
   - ST and UAT
   - Combined ST/UAT
   - ST only
   - UAT only (when explicitly stated)
   - Leverage vendor testing / No direct testing (for OOTB low‑risk cases)

5. Optional branches when present:
   - Data Migration Testing (DM)
   - Regression testing due to change
   - Vendor documentation reliance

How to interpret the description:
- Always derive logic from RRA‑style wording (GxP impact, business criticality, risk)
- Do NOT invent testing types not implied by the text
- Prefer regulatory terminology used in Validation Plans

Output requirements:
- Return ONLY a valid JSON object
- Do NOT include markdown, explanations, or surrounding text

JSON Output Format:
{{
  "nodes": [
    {{
      "id": "node_1",
      "type": "root",
      "data": {{
        "label": "Entry point testing strategy question"
      }}
    }},
    {{
      "id": "node_2",
      "type": "decision",
      "data": {{
        "label": "Risk / configuration decision question"
      }}
    }},
    {{
      "id": "node_3",
      "type": "outcome",
      "data": {{
        "label": "Testing approach or deliverable"
      }}
    }}
  ],
  "edges": [
    {{
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": null
    }},
    {{
      "id": "edge_2",
      "source": "node_2",
      "target": "node_3",
      "label": "Decision condition"
    }}
  ]
}}

Strict Rules:
- Exactly ONE root node (type: "root")
- Node IDs: node_1, node_2, node_3… (incrementing)
- Edge IDs: edge_1, edge_2, edge_3… (incrementing)
- Node labels max 30 characters
- Edge labels max 12 characters — use short tags only (e.g., "Yes", "No", "GxP Critical", "Low Risk", "Pass", "Fail", "Configured", "OOTB")
- Use CSV language only:
  GxP Critical, Business Essential, Low, ST, UAT, Combined ST/UAT,
  OOTB, Configured, RRA, Data Migration
- Decision nodes must be questions without question marks (e.g., "GxP Critical", not "Is it GxP Critical?")
- Outcome nodes must be concrete testing conclusions
- Minimum 3 nodes, maximum 10 nodes
- Only ONE edge between any pair of nodes — no duplicate edges for the same source→target pair
- Return ONLY the JSON object

Example intent (not literal text):
If requirement is GxP Critical → ST and UAT  
If Business Essential → Combined ST/UAT  
If Low risk → ST only or leverage vendor testing  

Now generate the decision tree JSON for the user's Testing Strategy."""
