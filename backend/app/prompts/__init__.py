"""
Prompts Package

Provides prompt dispatching for multiple diagram types.
"""

from app.prompts.testing_strategy_prompt import get_prompt as _decision_tree_prompt
from app.prompts.system_architecture import get_prompt as _system_architecture_prompt
from app.prompts.data_flow import get_prompt as _data_flow_prompt
from app.prompts.process_flow import get_prompt as _process_flow_prompt

VALID_DIAGRAM_TYPES = [
    "decision_tree",
    "system_architecture",
    "data_flow",
    "process_flow",
]

__all__ = ["VALID_DIAGRAM_TYPES", "get_prompt_for_type"]

_PROMPT_MAP = {
    "decision_tree": _decision_tree_prompt,
    "system_architecture": _system_architecture_prompt,
    "data_flow": _data_flow_prompt,
    "process_flow": _process_flow_prompt,
}


def get_prompt_for_type(diagram_type: str, description: str) -> str:
    """
    Dispatch to the correct prompt builder based on diagram_type.

    Args:
        diagram_type: One of VALID_DIAGRAM_TYPES.
        description: User's natural language description.

    Returns:
        Complete prompt string for the LLM API.

    Raises:
        ValueError: If diagram_type is not recognized.
    """
    prompt_fn = _PROMPT_MAP.get(diagram_type)
    if prompt_fn is None:
        raise ValueError(
            f"Unknown diagram_type '{diagram_type}'. "
            f"Valid types: {VALID_DIAGRAM_TYPES}"
        )
    return prompt_fn(description)
