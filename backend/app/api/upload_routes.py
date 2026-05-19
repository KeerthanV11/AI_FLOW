"""
Upload Routes

Endpoints for uploading source documents and output templates:
  POST /api/upload/template   — upload/replace the output template file
  POST /api/upload/knowledge  — upload one or more knowledge/source documents
  GET  /api/upload/status     — list currently uploaded files
"""

import os
import logging
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

upload_bp = Blueprint("upload", __name__)

# Resolve the input_files directory relative to this file:
# backend/app/api/upload_routes.py → go up 2 levels to backend/, then into input_files/
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_TEMPLATE_DIR = os.path.join(_BACKEND_DIR, "input_files", "template_files")
_KNOWLEDGE_DIR = os.path.join(_BACKEND_DIR, "input_files", "source_data_files")

_ALLOWED_EXTENSIONS = {".pdf", ".docx"}
_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _validate_file(file):
    """
    Validate that the uploaded file has an allowed extension and size.
    Returns (is_valid: bool, error_message: str | None).
    """
    filename = secure_filename(file.filename)
    if not filename:
        return False, "No filename provided"

    ext = os.path.splitext(filename)[1].lower()
    if ext not in _ALLOWED_EXTENSIONS:
        return False, f"File type '{ext}' not allowed. Only PDF and DOCX are accepted."

    # Seek to end to check size without full read
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)

    if size > _MAX_FILE_SIZE:
        return False, f"File '{filename}' exceeds the 20 MB size limit."

    return True, None


@upload_bp.route("/api/upload/template", methods=["POST"])
def upload_template():
    """
    Upload Output Template
    ---
    tags:
      - Upload
    consumes:
      - multipart/form-data
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: The output template file (PDF or DOCX, max 20 MB)
    responses:
      200:
        description: Template uploaded successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: "ok"
            filename:
              type: string
              example: "template.docx"
      400:
        description: Validation error (wrong type, too large, or missing file)
    """
    if "file" not in request.files:
        return jsonify({"detail": "No file provided. Use field name 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"detail": "No file selected."}), 400

    is_valid, error = _validate_file(file)
    if not is_valid:
        return jsonify({"detail": error}), 400

    filename = secure_filename(file.filename)

    # Clear any existing template files before saving the new one
    for existing in os.listdir(_TEMPLATE_DIR):
        if existing != ".gitkeep":
            os.remove(os.path.join(_TEMPLATE_DIR, existing))

    save_path = os.path.join(_TEMPLATE_DIR, filename)
    file.save(save_path)
    logger.info(f"Template saved: {filename}")

    return jsonify({"status": "ok", "filename": filename})


@upload_bp.route("/api/upload/knowledge", methods=["POST"])
def upload_knowledge():
    """
    Upload Knowledge / Source Documents
    ---
    tags:
      - Upload
    consumes:
      - multipart/form-data
    parameters:
      - name: files
        in: formData
        type: array
        items:
          type: file
        required: true
        description: One or more source documents (PDF or DOCX, max 20 MB each)
    responses:
      200:
        description: Files uploaded successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: "ok"
            uploaded:
              type: array
              items:
                type: string
            count:
              type: integer
      400:
        description: Validation error
    """
    files = request.files.getlist("files")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"detail": "No files provided. Use field name 'files'."}), 400

    uploaded = []
    errors = []

    for file in files:
        if file.filename == "":
            continue
        is_valid, error = _validate_file(file)
        if not is_valid:
            errors.append(error)
            continue

        filename = secure_filename(file.filename)
        # Avoid overwriting: append a counter if filename already exists
        save_path = os.path.join(_KNOWLEDGE_DIR, filename)
        counter = 1
        base, ext = os.path.splitext(filename)
        while os.path.exists(save_path):
            filename = f"{base}_{counter}{ext}"
            save_path = os.path.join(_KNOWLEDGE_DIR, filename)
            counter += 1

        file.save(save_path)
        uploaded.append(filename)
        logger.info(f"Knowledge doc saved: {filename}")

    if errors:
        return jsonify({"detail": "; ".join(errors), "uploaded": uploaded}), 400

    return jsonify({"status": "ok", "uploaded": uploaded, "count": len(uploaded)})


@upload_bp.route("/api/upload/status", methods=["GET"])
def upload_status():
    """
    Get Upload Status
    ---
    tags:
      - Upload
    responses:
      200:
        description: Current upload status
        schema:
          type: object
          properties:
            template_file:
              type: string
              nullable: true
              example: "template.docx"
            knowledge_files:
              type: array
              items:
                type: string
            knowledge_count:
              type: integer
    """
    template_files = [
        f for f in os.listdir(_TEMPLATE_DIR) if f != ".gitkeep"
    ]
    template_file = template_files[0] if template_files else None

    knowledge_files = sorted(
        f for f in os.listdir(_KNOWLEDGE_DIR) if f != ".gitkeep"
    )

    return jsonify({
        "template_file": template_file,
        "knowledge_files": knowledge_files,
        "knowledge_count": len(knowledge_files),
    })
