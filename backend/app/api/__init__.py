"""
API Blueprint Registration

Registers all route blueprints with the Flask app.
"""


def register_blueprints(app):
    """Register all API blueprints."""
    from app.api.diagram_routes import diagram_bp
    from app.api.diagram_routes_v1 import diagram_v1_bp
    from app.api.document_routes import document_bp
    from app.api.upload_routes import upload_bp
    from app.api.process_routes import process_bp
    from app.api.document_embed_routes import document_embed_bp
    from app.api.image_routes import image_bp

    app.register_blueprint(diagram_bp)
    app.register_blueprint(diagram_v1_bp)
    app.register_blueprint(document_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(process_bp)
    app.register_blueprint(document_embed_bp)
    app.register_blueprint(image_bp)
