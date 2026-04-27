"""
JSON Parser

Parses and validates JSON responses from the LLM.
"""

import json
import re
from typing import Dict, Any


def parse_json_response(text: str) -> Dict[str, Any]:
    """
    Extract and parse JSON from LLM response.
    
    Handles edge cases like markdown-fenced JSON.
    
    Args:
        text: Raw response text from LLM
        
    Returns:
        Parsed JSON as dictionary
        
    Raises:
        json.JSONDecodeError: If JSON is invalid
        ValueError: If structure is invalid
    """
    
    # Clean whitespace
    text = text.strip()
    
    # Extract JSON from markdown fences if present
    if text.startswith("```"):
        # Remove markdown fence and language specifier
        match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
        if match:
            text = match.group(1)
    
    # Try to find JSON object if surrounded by text
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match and not text.startswith('{'):
        text = json_match.group(0)
    
    # Parse JSON
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(
            f"Failed to parse JSON response: {e.msg}",
            e.doc,
            e.pos
        )
    
    # Basic structure validation
    if not isinstance(data, dict):
        raise ValueError("Root element must be a JSON object")
    
    if "nodes" not in data or "edges" not in data:
        raise ValueError("Response must contain 'nodes' and 'edges' arrays")
    
    if not isinstance(data["nodes"], list):
        raise ValueError("'nodes' must be an array")
    
    if not isinstance(data["edges"], list):
        raise ValueError("'edges' must be an array")
    
    if len(data["nodes"]) == 0:
        raise ValueError("Response must contain at least one node")
    
    return data
