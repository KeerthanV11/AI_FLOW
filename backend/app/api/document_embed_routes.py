"""
Document Embed Routes

Receives a finalised diagram (nodes + edges) from the frontend and embeds it
into the uploaded output template document.

  POST /api/document/embed — embed diagram in template and return download
"""

import logging
from flask import Blueprint, request, jsonify

logger = logging.getLogger(__name__)

document_embed_bp = Blueprint("document_embed", __name__)


@document_embed_bp.route("/api/document/embed", methods=["POST"])
def embed_diagram():
    """
    Embed Diagram in Output Document
    ---
    tags:
      - Document
    summary: Receive finalised diagram nodes/edges and embed in the output template
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - nodes
            - edges
          properties:
            nodes:
              type: array
              description: Finalised diagram nodes from the frontend editor
            edges:
              type: array
              description: Finalised diagram edges from the frontend editor
            diagram_type:
              type: string
              example: "system_architecture"
    responses:
      200:
        description: Diagram received (embedding not yet implemented)
        schema:
          type: object
          properties:
            status:
              type: string
              example: "received"
            message:
              type: string
      400:
        description: Missing required fields
      501:
        description: Full document embedding not yet implemented
    """
    data = request.get_json()
    if not data:
        return jsonify({"detail": "No JSON body provided"}), 400

    nodes = data.get("nodes")
    edges = data.get("edges")
    diagram_type = data.get("diagram_type", "system_architecture")

    if nodes is None or edges is None:
        return jsonify({"detail": "Missing 'nodes' or 'edges' fields"}), 400

    logger.info(
        f"Received finalised diagram for embedding: {len(nodes)} nodes, "
        f"{len(edges)} edges, type={diagram_type}"
    )

    # TODO: Implement full document generation — render diagram as image,
    # insert into template DOCX, and return the file as a download.
    return jsonify({
        "status": "received",
        "message": (
            "Diagram data received successfully. "
            "Full document embedding is not yet implemented."
        ),
        "node_count": len(nodes),
        "edge_count": len(edges),
        "diagram_type": diagram_type,
    }), 200
