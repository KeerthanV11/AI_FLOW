"""
Token Usage Tracker

Records input/output token counts and cost for every LLM call.
Persists to a JSON file and maintains a running grand total.
"""

import json
import logging
import os
import threading
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Cost per 1M tokens (USD)
INPUT_COST_PER_1M = 1.25
OUTPUT_COST_PER_1M = 11.00

_USAGE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "token_usage.json")
_lock = threading.Lock()


def _empty_usage() -> dict:
    """Return a fresh usage structure."""
    return {
        "grand_total": {
            "input_tokens": 0,
            "output_tokens": 0,
            "input_cost_usd": 0.0,
            "output_cost_usd": 0.0,
            "total_cost_usd": 0.0,
        },
        "calls": [],
    }


def _load_usage() -> dict:
    """Load the usage file, or return a fresh structure."""
    if os.path.exists(_USAGE_FILE):
        try:
            with open(_USAGE_FILE, "r") as f:
                data = json.load(f)
                if isinstance(data, dict) and "grand_total" in data:
                    return data
        except (json.JSONDecodeError, ValueError):
            logger.warning("token_usage.json is corrupted/empty — resetting")
    return _empty_usage()


def _save_usage(data: dict):
    """Write the usage data to disk."""
    with open(_USAGE_FILE, "w") as f:
        json.dump(data, f, indent=2)


def record_usage(input_tokens: int, output_tokens: int, model: str = "", diagram_type: str = ""):
    """
    Record a single LLM call's token usage and cost.

    Args:
        input_tokens:  Prompt / input token count.
        output_tokens: Completion / output token count.
        model:         Model or deployment name used.
        diagram_type:  Diagram type requested (optional context).
    """
    input_cost = (input_tokens / 1_000_000) * INPUT_COST_PER_1M
    output_cost = (output_tokens / 1_000_000) * OUTPUT_COST_PER_1M
    total_cost = input_cost + output_cost

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": model,
        "diagram_type": diagram_type,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "input_cost_usd": round(input_cost, 6),
        "output_cost_usd": round(output_cost, 6),
        "total_cost_usd": round(total_cost, 6),
    }

    with _lock:
        data = _load_usage()
        data["calls"].append(entry)

        gt = data["grand_total"]
        gt["input_tokens"] += input_tokens
        gt["output_tokens"] += output_tokens
        gt["input_cost_usd"] = round(gt["input_cost_usd"] + input_cost, 6)
        gt["output_cost_usd"] = round(gt["output_cost_usd"] + output_cost, 6)
        gt["total_cost_usd"] = round(gt["total_cost_usd"] + total_cost, 6)

        _save_usage(data)

    logger.info(
        f"Token usage — in: {input_tokens}, out: {output_tokens}, "
        f"cost: ${total_cost:.6f} | running total: ${data['grand_total']['total_cost_usd']:.6f}"
    )
    return entry


def get_usage_summary() -> dict:
    """Return the current grand total from the usage file."""
    with _lock:
        data = _load_usage()
    return data["grand_total"]
