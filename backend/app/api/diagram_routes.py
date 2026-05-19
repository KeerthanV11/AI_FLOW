"""
Diagram Routes

Endpoints for diagram generation:
  POST /api/diagram/generate — generate a decision tree from description
  GET  /health              — health check
  GET  /                    — API info
"""

import logging
import threading
from flask import Blueprint, request, jsonify
from app.services.diagram_service import generate_diagram
from app.api.diagram_state import get_current_diagram, set_current_diagram

logger = logging.getLogger(__name__)

diagram_bp = Blueprint("diagram", __name__)

# Request throttling: one generate request at a time
_GENERATE_LOCK = threading.Lock()

# Diagram types exposed through this API (data_flow/process_flow remain in prompts layer)
_ALLOWED_DIAGRAM_TYPES = ["decision_tree", "system_architecture"]


@diagram_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health Check Endpoint
    ---
    tags:
      - Health
    responses:
      200:
        description: Service is running
        schema:
          type: object
          properties:
            status:
              type: string
              example: "ok"
    """
    return jsonify({"status": "ok"})


@diagram_bp.route("/api/diagram/generate", methods=["POST"])
def generate_diagram_endpoint():
    """
    Generate Decision Tree Diagram
    ---
    tags:
      - Diagram
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
              example: "Should I go outside? If it's raining, stay inside. If it's sunny, go to the park."
              description: Natural language description of the decision tree (10-5000 characters)
    responses:
      200:
        description: Successfully generated decision tree diagram
        schema:
          type: object
          properties:
            nodes:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    example: "node_1"
                  type:
                    type: string
                    enum: [root, decision, outcome]
                    example: "root"
                  data:
                    type: object
                    properties:
                      label:
                        type: string
                        example: "Should I go outside?"
            edges:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    example: "edge_1"
                  source:
                    type: string
                    example: "node_1"
                  target:
                    type: string
                    example: "node_2"
                  label:
                    type: string
                    example: "Yes"
                    nullable: true
      422:
        description: Validation error
      500:
        description: Server error
    """
    with _GENERATE_LOCK:
        try:
            data = request.get_json()
            if not data:
                return jsonify({"detail": "No JSON body provided"}), 422

            description = data.get("description")
            if not description:
                return jsonify({"detail": "Missing 'description' field"}), 422

            diagram_type = data.get("diagram_type", "decision_tree")

            # Restrict to decision_tree and system_architecture
            if diagram_type not in _ALLOWED_DIAGRAM_TYPES:
                return jsonify({
                    "detail": f"Invalid diagram_type '{diagram_type}'. Valid types: {_ALLOWED_DIAGRAM_TYPES}"
                }), 422

            logger.info(f"Generating {diagram_type} diagram for description: {description[:100]}...")

            result = generate_diagram(description, diagram_type)

            # Store in shared state so GET /api/diagram/current can retrieve it
            diagram_data = result.to_dict()
            diagram_data["diagram_type"] = diagram_type
            set_current_diagram(diagram_data)

            logger.info(
                f"Successfully generated tree with "
                f"{len(result.nodes)} nodes and {len(result.edges)} edges"
            )
            return jsonify(result.to_dict())

        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            return jsonify({"detail": f"Invalid response from AI: {str(e)}"}), 422

        except Exception as e:
            logger.error(f"Failed to generate diagram: {str(e)}")
            return jsonify({"detail": f"Failed to generate diagram: {str(e)}"}), 500


@diagram_bp.route("/api/diagram/current", methods=["GET"])
def get_current_diagram_endpoint():
    """
    Get Current Diagram
    ---
    tags:
      - Diagram
    summary: Retrieve the most recently generated diagram (nodes + edges)
    description: >
      Returns the diagram generated by the most recent call to either
      POST /api/diagram/generate or POST /api/process/generate.
      Returns 404 if no diagram has been generated yet.
    responses:
      200:
        description: Current diagram data
        schema:
          type: object
          properties:
            nodes:
              type: array
            edges:
              type: array
            diagram_type:
              type: string
              example: "system_architecture"
      404:
        description: No diagram has been generated yet
    """
    diagram = get_current_diagram()
    if diagram is None:
        return jsonify({"detail": "No diagram has been generated yet."}), 404
    return jsonify(diagram)


@diagram_bp.route("/", methods=["GET"])
def root():
    """Root endpoint with API information."""
    return jsonify({
        "message": "Decision Tree Generator API",
        "endpoints": {
            "health": "/health",
            "generate_diagram": "/api/diagram/generate (POST)",
            "generate_diagram_v1": "/api/v1/diagram/generate (POST)",
            "generate_diagram_batch": "/api/v1/diagram/generate-batch (POST)",
            "generate_document": "/api/document/generate (POST) [coming soon]"
        }
    })
