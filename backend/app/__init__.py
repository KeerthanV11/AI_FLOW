"""
Application Factory

Creates and configures the Flask application.
"""

from flask import Flask
from flask_cors import CORS
from flasgger import Flasgger


def create_app():
    """Create and configure the Flask application."""
    from app.config import APP_NAME, CORS_ORIGINS

    app = Flask(APP_NAME)

    # Initialize Swagger/Flasgger
    Flasgger(app)

    # Enable CORS
    CORS(app, resources={
        r"/*": {
            "origins": CORS_ORIGINS,
            "allow_headers": ["Content-Type"],
            "methods": ["GET", "POST", "OPTIONS"]
        }
    })

    # Register blueprints
    from app.api import register_blueprints
    register_blueprints(app)

    return app
