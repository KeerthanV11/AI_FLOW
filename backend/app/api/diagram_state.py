"""
Diagram State

File-backed store for the most recently generated diagram.
Using a JSON file so state survives Flask debug-mode reloads.
Both process_routes (writes) and diagram_routes (reads) import from here.
"""

import json
import os

_STATE_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "current_diagram.json")
_STATE_FILE = os.path.abspath(_STATE_FILE)


def get_current_diagram():
    """Return the current stored diagram dict, or None if not yet generated."""
    if not os.path.exists(_STATE_FILE):
        return None
    try:
        with open(_STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def set_current_diagram(data):
    """Persist a new diagram result dict to disk."""
    with open(_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)
