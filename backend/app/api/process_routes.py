"""
Process Routes

Triggers backend processing of uploaded documents and diagram generation.
This endpoint reads the uploaded source files, builds a description, and
calls the diagram service to generate a system_architecture diagram.

The result is stored in a shared in-memory state (_CURRENT_DIAGRAM) that
is also readable via GET /api/diagram/current.

  POST /api/process/generate — process uploads and generate diagram
"""

import logging
import threading
from flask import Blueprint, request, jsonify
from app.services.diagram_service import generate_diagram
from app.api.diagram_state import set_current_diagram

logger = logging.getLogger(__name__)

process_bp = Blueprint("process", __name__)

_PROCESS_LOCK = threading.Lock()


@process_bp.route("/api/process/test", methods=["POST"])
def process_test():
    """
    Test Process Route (no LLM call)
    ---
    tags:
      - Process
    summary: Returns a mock diagram instantly — use to verify the endpoint is reachable
    responses:
      200:
        description: Mock diagram returned
    """
    mock = {
        "status": "ok",
        "diagram_type": "decision_tree",
        "message": "Test endpoint reached successfully — LLM not called",
    }
    from app.api.diagram_state import set_current_diagram
    set_current_diagram({
        "diagram_type": "decision_tree",
        "nodes": [
            {"id": "1", "type": "input", "data": {"label": "Start"}, "position": {"x": 250, "y": 0}},
            {"id": "2", "type": "default", "data": {"label": "Decision?"}, "position": {"x": 250, "y": 100}},
            {"id": "3", "type": "output", "data": {"label": "Yes → Done"}, "position": {"x": 100, "y": 200}},
            {"id": "4", "type": "output", "data": {"label": "No → Retry"}, "position": {"x": 400, "y": 200}},
        ],
        "edges": [
            {"id": "e1-2", "source": "1", "target": "2"},
            {"id": "e2-3", "source": "2", "target": "3", "label": "Yes"},
            {"id": "e2-4", "source": "2", "target": "4", "label": "No"},
        ],
    })
    return jsonify(mock)


@process_bp.route("/api/process/generate", methods=["POST"])
def process_and_generate():
    """
    Generate Decision Tree Diagram from Description
    ---
    tags:
      - Process
    summary: Provide a description and generate a decision tree diagram
    description: >
      Accepts a natural-language description and generates a decision_tree diagram.
      The result is stored in memory and can be fetched by the frontend via
      GET /api/diagram/current. Trigger this endpoint from Swagger after uploading
      documents on the frontend — the frontend editor page will pick up the result.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - description
          properties:
            description:
              type: string
              example: "User submits a claim. If valid, route to payment processing. If invalid, notify user and close."
              description: Natural-language description of the decision tree to generate.
    responses:
      200:
        description: Diagram generated and stored
        schema:
          type: object
          properties:
            status:
              type: string
              example: "ok"
            diagram_type:
              type: string
              example: "decision_tree"
            node_count:
              type: integer
            edge_count:
              type: integer
      400:
        description: Missing or invalid description
      500:
        description: Diagram generation failed
    """
    acquired = _PROCESS_LOCK.acquire(timeout=5)
    if not acquired:
        return jsonify({
            "detail": "Server is busy processing another request. Please wait a moment and try again."
        }), 503

    try:
        print("\n>>> /api/process/generate called", flush=True)
        data = request.get_json(silent=True) or {}
        description = (data.get("description") or "").strip()
        print(f">>> description received: {description[:80]!r}", flush=True)

        if not description:
            return jsonify({
                "detail": "Missing 'description' field. Provide a natural-language description of the decision tree."
            }), 400

        logger.info(f"Generating decision_tree diagram. Description: {description[:120]}...")
        print(f">>> calling generate_diagram...", flush=True)

        result = generate_diagram(description, "decision_tree")
        print(f">>> generate_diagram returned {len(result.nodes)} nodes", flush=True)

        diagram_data = result.to_dict()
        diagram_data["diagram_type"] = "decision_tree"
        set_current_diagram(diagram_data)

        logger.info(
            f"Diagram generated: {len(result.nodes)} nodes, {len(result.edges)} edges"
        )

        return jsonify({
            "status": "ok",
            "diagram_type": "decision_tree",
            "node_count": len(result.nodes),
            "edge_count": len(result.edges),
        })

    except Exception as e:
        logger.error(f"Failed to generate diagram: {str(e)}")
        return jsonify({"detail": f"Diagram generation failed: {str(e)}"}), 500

    finally:
        _PROCESS_LOCK.release()
