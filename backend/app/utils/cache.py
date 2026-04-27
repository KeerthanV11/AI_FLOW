"""
Simple in-memory cache for API responses.
Prevents re-querying the same decision tree descriptions.
"""

import hashlib
from typing import Optional

# Simple in-memory cache (use Redis for production)
_response_cache = {}


def _hash_key(description: str, diagram_type: str = "decision_tree") -> str:
    """Generate a hash key from description and diagram type."""
    combined = f"{diagram_type}:{description}"
    return hashlib.sha256(combined.encode()).hexdigest()[:16]


def get_cached_response(description: str, diagram_type: str = "decision_tree") -> Optional[str]:
    """
    Retrieve cached response for a description and diagram type.
    
    Args:
        description: Natural language description
        diagram_type: Type of diagram
        
    Returns:
        Cached JSON response or None
    """
    key = _hash_key(description, diagram_type)
    return _response_cache.get(key)


def cache_response(description: str, response: str, diagram_type: str = "decision_tree") -> None:
    """
    Cache the API response for a description and diagram type.
    
    Args:
        description: Natural language description
        response: Raw API response (JSON string)
        diagram_type: Type of diagram
    """
    key = _hash_key(description, diagram_type)
    _response_cache[key] = response
