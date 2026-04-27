"""
Typed Response Models

Dataclasses for diagram generation results, used by both the
SDK facade and the REST API routes.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class DiagramNode:
    """A single node in a generated diagram."""
    id: str
    type: str
    data: dict  # {"label": "..."}


@dataclass
class DiagramEdge:
    """A single edge (connection) in a generated diagram."""
    id: str
    source: str
    target: str
    label: Optional[str] = None


@dataclass
class DiagramResult:
    """
    Complete result of a diagram generation request.

    Attributes:
        nodes: List of diagram nodes.
        edges: List of diagram edges.
        diagram_type: The type that was requested.
    """
    nodes: list[dict] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)
    diagram_type: str = "decision_tree"

    def to_dict(self) -> dict:
        """Return the nodes/edges as a plain dict (API-compatible)."""
        return {"nodes": self.nodes, "edges": self.edges}

    def to_json(self) -> str:
        """Return the nodes/edges as a JSON string."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_parsed(cls, parsed: dict, diagram_type: str = "decision_tree") -> DiagramResult:
        """Create a DiagramResult from a parsed LLM response dict."""
        return cls(
            nodes=parsed["nodes"],
            edges=parsed["edges"],
            diagram_type=diagram_type,
        )
