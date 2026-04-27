"""
Diagram Routes — API v1

Versioned endpoints with request-ID tracing and batch support:
  POST /api/v1/diagram/generate        — single diagram
  POST /api/v1/diagram/generate-batch   — multiple diagrams
"""

import logging
import threading
import uuid
from flask import Blueprint, request, jsonify, make_response
from app.services.diagram_service import generate_diagram

logger = logging.getLogger(__name__)

diagram_v1_bp = Blueprint("diagram_v1", __name__)

_GENERATE_LOCK = threading.Lock()


def _get_request_id() -> str:
    """Return the caller-supplied request ID or generate one."""
    return request.headers.get("X-Request-ID", str(uuid.uuid4()))


# ------------------------------------------------------------------
# Single generation
# ------------------------------------------------------------------

@diagram_v1_bp.route("/api/v1/diagram/generate", methods=["POST"])
def generate_diagram_v1():
    """
    Generate Diagram (v1)
    ---
    tags:
      - Diagram v1
    parameters:
      - name: X-Request-ID
        in: header
        type: string
        required: false
        description: Optional correlation ID echoed back in the response
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
              description: Natural language description (10-5000 characters)
            diagram_type:
              type: string
              enum: [decision_tree, system_architecture, data_flow, process_flow]
              default: decision_tree
    responses:
      200:
        description: Successfully generated diagram
      422:
        description: Validation error
      500:
        description: Server error
    """
    request_id = _get_request_id()

    with _GENERATE_LOCK:
        try:
            data = request.get_json()
            if not data:
                return _error_response("No JSON body provided", 422, request_id)

            description = data.get("description")
            if not description:
                return _error_response("Missing 'description' field", 422, request_id)

            diagram_type = data.get("diagram_type", "decision_tree")

            from app.prompts import VALID_DIAGRAM_TYPES
            if diagram_type not in VALID_DIAGRAM_TYPES:
                return _error_response(
                    f"Invalid diagram_type '{diagram_type}'. Valid types: {VALID_DIAGRAM_TYPES}",
                    422, request_id,
                )

            logger.info(f"[{request_id}] Generating {diagram_type} diagram...")
            result = generate_diagram(description, diagram_type)

            logger.info(
                f"[{request_id}] Generated {len(result.nodes)} nodes, "
                f"{len(result.edges)} edges"
            )

            body = result.to_dict()
            body["request_id"] = request_id
            resp = make_response(jsonify(body))
            resp.headers["X-Request-ID"] = request_id
            return resp

        except ValueError as e:
            logger.error(f"[{request_id}] Validation error: {e}")
            return _error_response(f"Invalid response from AI: {e}", 422, request_id)

        except Exception as e:
            logger.error(f"[{request_id}] Failed: {e}")
            return _error_response(f"Failed to generate diagram: {e}", 500, request_id)


# ------------------------------------------------------------------
# Batch generation
# ------------------------------------------------------------------

@diagram_v1_bp.route("/api/v1/diagram/generate-batch", methods=["POST"])
def generate_diagram_batch():
    """
    Batch Generate Diagrams (v1)
    ---
    tags:
      - Diagram v1
    parameters:
      - name: X-Request-ID
        in: header
        type: string
        required: false
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - items
          properties:
            items:
              type: array
              items:
                type: object
                required:
                  - description
                properties:
                  description:
                    type: string
                  diagram_type:
                    type: string
                    default: decision_tree
    responses:
      200:
        description: Array of results in same order as input
      422:
        description: Validation error
    """
    request_id = _get_request_id()

    data = request.get_json()
    if not data or "items" not in data:
        return _error_response("Body must contain an 'items' array", 422, request_id)

    items = data["items"]
    if not isinstance(items, list) or len(items) == 0:
        return _error_response("'items' must be a non-empty array", 422, request_id)

    if len(items) > 10:
        return _error_response("Maximum 10 items per batch request", 422, request_id)

    from app.prompts import VALID_DIAGRAM_TYPES

    results = []
    with _GENERATE_LOCK:
        for idx, item in enumerate(items):
            desc = item.get("description")
            dtype = item.get("diagram_type", "decision_tree")

            if not desc:
                results.append({"error": f"Item {idx}: missing 'description'"})
                continue
            if dtype not in VALID_DIAGRAM_TYPES:
                results.append({"error": f"Item {idx}: invalid diagram_type '{dtype}'"})
                continue

            try:
                result = generate_diagram(desc, dtype)
                results.append(result.to_dict())
            except Exception as e:
                logger.error(f"[{request_id}] Batch item {idx} failed: {e}")
                results.append({"error": f"Item {idx}: {str(e)}"})

    body = {"results": results, "request_id": request_id}
    resp = make_response(jsonify(body))
    resp.headers["X-Request-ID"] = request_id
    return resp


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _error_response(detail: str, status: int, request_id: str):
    """Build a JSON error response with the request ID header."""
    resp = make_response(jsonify({"detail": detail, "request_id": request_id}), status)
    resp.headers["X-Request-ID"] = request_id
    return resp
