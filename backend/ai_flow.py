"""
AI Flow Diagrams — SDK Facade

Public API for programmatic diagram generation.
Import this module instead of reaching into app internals.

Usage::

    from ai_flow import DiagramGenerator

    generator = DiagramGenerator({
        "api_key": "sk-...",
        "endpoint": "https://my-resource.openai.azure.com/",
        "deployment_name": "gpt-4o",
    })

    result = generator.generate(
        description="User login flow with MFA",
        diagram_type="process_flow",
    )

    print(result.nodes)   # list of node dicts
    print(result.edges)   # list of edge dicts
    print(result.to_dict())  # {"nodes": [...], "edges": [...]}
"""

from __future__ import annotations

import logging
from typing import Optional

from app.config import Config
from app.models import DiagramResult
from app.prompts import VALID_DIAGRAM_TYPES, get_prompt_for_type
from app.utils.cache import get_cached_response, cache_response
from app.utils.json_parser import parse_json_response

logger = logging.getLogger(__name__)


class DiagramGenerator:
    """
    High-level interface for generating diagrams via LLM.

    Can be used standalone (Python SDK) without starting the Flask server.

    Args:
        config: A dict with keys ``api_key``, ``endpoint``, ``deployment_name``
                (and optionally ``api_version``).  If *None*, falls back to
                environment variables loaded by ``app.config``.
    """

    def __init__(self, config: Optional[dict] = None):
        if config is not None:
            self._config = Config.from_dict(config)
        else:
            self._config = Config.from_env()

        # Build a dedicated provider for this generator instance
        from app.llm.azure_openai_provider import AzureOpenAIProvider
        self._provider = AzureOpenAIProvider(
            api_key=self._config.azure_openai_api_key,
            endpoint=self._config.azure_openai_endpoint,
            deployment_name=self._config.azure_openai_deployment_name,
            api_version=self._config.azure_openai_api_version,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(self, description: str, diagram_type: str = "decision_tree") -> DiagramResult:
        """
        Generate a diagram from a natural language description.

        Args:
            description: What the diagram should represent (10-5000 chars).
            diagram_type: One of ``supported_diagram_types()``.

        Returns:
            A ``DiagramResult`` with ``.nodes``, ``.edges``, and helper
            methods ``.to_dict()`` / ``.to_json()``.

        Raises:
            ValueError: Invalid ``diagram_type`` or un-parsable LLM output.
            Exception: LLM API call failure.
        """
        if diagram_type not in VALID_DIAGRAM_TYPES:
            raise ValueError(
                f"Invalid diagram_type '{diagram_type}'. "
                f"Valid types: {VALID_DIAGRAM_TYPES}"
            )

        # Cache check
        cached = get_cached_response(description, diagram_type)
        if cached:
            logger.info("Cache HIT — returning cached response")
            parsed = parse_json_response(cached)
            return DiagramResult.from_parsed(parsed, diagram_type)

        # Build prompt & call LLM
        prompt = get_prompt_for_type(diagram_type, description)
        raw_response = self._provider.generate_json(prompt)
        logger.info("Received response from LLM, parsing JSON...")

        # Parse, cache, return
        parsed = parse_json_response(raw_response)
        cache_response(description, raw_response, diagram_type)
        return DiagramResult.from_parsed(parsed, diagram_type)

    @staticmethod
    def supported_diagram_types() -> list[str]:
        """Return the list of supported diagram type identifiers."""
        return list(VALID_DIAGRAM_TYPES)
