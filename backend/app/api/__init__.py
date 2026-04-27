"""
API Blueprint Registration

Registers all route blueprints with the Flask app.
"""


def register_blueprints(app):
    """Register all API blueprints."""
    from app.api.diagram_routes import diagram_bp
    from app.api.diagram_routes_v1 import diagram_v1_bp
    from app.api.document_routes import document_bp

    app.register_blueprint(diagram_bp)
    app.register_blueprint(diagram_v1_bp)
    app.register_blueprint(document_bp)
