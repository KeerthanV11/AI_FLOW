"""
Diagram Service

Orchestrates decision tree diagram generation:
  cache check → build prompt → call LLM → parse JSON
"""

import logging
from app.llm import get_provider
from app.models import DiagramResult
from app.prompts import get_prompt_for_type
from app.utils.cache import get_cached_response, cache_response
from app.utils.json_parser import parse_json_response

logger = logging.getLogger(__name__)


def generate_diagram(description: str, diagram_type: str = "decision_tree") -> DiagramResult:
    """
    Generate a diagram from a natural language description.

    Args:
        description: Natural language description of the diagram.
        diagram_type: Type of diagram to generate (decision_tree, system_architecture, data_flow, process_flow).

    Returns:
        DiagramResult with 'nodes' and 'edges'.

    Raises:
        ValueError: If the LLM response is invalid JSON or fails validation.
        Exception: If the LLM API call fails.
    """
    # 1. Check cache
    cached = get_cached_response(description, diagram_type)
    if cached:
        logger.info("Cache HIT — returning cached response")
        parsed = parse_json_response(cached)
        return DiagramResult.from_parsed(parsed, diagram_type)

    # 2. Build prompt for the requested diagram type
    prompt = get_prompt_for_type(diagram_type, description)

    # 3. Call LLM
    provider = get_provider()
    raw_response = provider.generate_json(prompt)
    logger.info("Received response from LLM, parsing JSON...")

    # 4. Parse and validate
    parsed = parse_json_response(raw_response)

    # 5. Cache successful response
    cache_response(description, raw_response, diagram_type)
    logger.info("Response cached for future use")

    return DiagramResult.from_parsed(parsed, diagram_type)
