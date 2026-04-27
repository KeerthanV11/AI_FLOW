"""
Document Routes (Placeholder)

Future endpoint for the writer agent:
  POST /api/document/generate — generate a full validation plan DOCX
"""

from flask import Blueprint, jsonify

document_bp = Blueprint("document", __name__)


@document_bp.route("/api/document/generate", methods=["POST"])
def generate_document_endpoint():
    """
    Generate Validation Plan Document (Coming Soon)
    ---
    tags:
      - Document
    responses:
      501:
        description: Not yet implemented
    """
    return jsonify({
        "detail": "Document generation is not yet implemented. "
                  "The writer agent will be integrated here."
    }), 501
