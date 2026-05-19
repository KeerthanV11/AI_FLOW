"""
Image Routes

Saves the finalized diagram image sent from the frontend.

  POST /api/image/save  — receive a base64 PNG and persist to generated_images/
  GET  /api/image/list  — list all saved images
"""

import os
import base64
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify

logger = logging.getLogger(__name__)

image_bp = Blueprint("image", __name__)

# Resolve generated_images/ relative to this file:
# backend/app/api/image_routes.py → up 2 levels to backend/, then into generated_images/
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_IMAGES_DIR = os.path.join(_BACKEND_DIR, "generated_images")

os.makedirs(_IMAGES_DIR, exist_ok=True)


@image_bp.route("/api/image/save", methods=["POST"])
def save_image():
    """
    Save Finalized Diagram Image
    ---
    tags:
      - Image
    summary: Receive a base64-encoded PNG from the frontend and persist it to generated_images/
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - image
          properties:
            image:
              type: string
              description: Base64 data-URL of the PNG (data:image/png;base64,...)
            diagram_type:
              type: string
              example: decision_tree
            filename:
              type: string
              description: Optional custom filename (without extension)
    responses:
      200:
        description: Image saved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            filename:
              type: string
              example: decision_tree_20260519_143012.png
            path:
              type: string
              example: generated_images/decision_tree_20260519_143012.png
      400:
        description: Missing or invalid image data
      500:
        description: Failed to save image
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"detail": "No JSON body provided"}), 400

    image_data_url = data.get("image", "")
    if not image_data_url:
        return jsonify({"detail": "Missing 'image' field"}), 400

    diagram_type = data.get("diagram_type", "diagram")
    custom_filename = data.get("filename", "").strip()

    # Strip the data-url prefix
    if "," in image_data_url:
        header, b64_data = image_data_url.split(",", 1)
        if "png" not in header and "jpeg" not in header and "jpg" not in header:
            return jsonify({"detail": "Only PNG/JPEG images are accepted"}), 400
        ext = "jpg" if "jpeg" in header or "jpg" in header else "png"
    else:
        b64_data = image_data_url
        ext = "png"

    # Build filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if custom_filename:
        safe_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in custom_filename)
        filename = f"{safe_name}_{timestamp}.{ext}"
    else:
        safe_type = diagram_type.replace(" ", "_").lower()
        filename = f"{safe_type}_{timestamp}.{ext}"

    file_path = os.path.join(_IMAGES_DIR, filename)

    try:
        image_bytes = base64.b64decode(b64_data)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        logger.info(f"Saved diagram image: {filename}")
    except Exception as e:
        logger.error(f"Failed to save image: {e}")
        return jsonify({"detail": f"Failed to save image: {str(e)}"}), 500

    return jsonify({
        "status": "ok",
        "filename": filename,
        "path": os.path.join("generated_images", filename),
    })


@image_bp.route("/api/image/list", methods=["GET"])
def list_images():
    """
    List Saved Diagram Images
    ---
    tags:
      - Image
    summary: Return all images stored in generated_images/
    responses:
      200:
        description: List of saved images
        schema:
          type: object
          properties:
            images:
              type: array
              items:
                type: string
            count:
              type: integer
    """
    try:
        files = sorted(
            f for f in os.listdir(_IMAGES_DIR)
            if f.lower().endswith((".png", ".jpg", ".jpeg"))
        )
        return jsonify({"images": files, "count": len(files)})
    except Exception as e:
        return jsonify({"detail": str(e)}), 500
