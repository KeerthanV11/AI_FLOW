"""
Application Factory

Creates and configures the Flask application.
"""

from flask import Flask
from flask_cors import CORS
from flasgger import Swagger


def create_app():
    """Create and configure the Flask application."""
    from app.config import APP_NAME, CORS_ORIGINS

    app = Flask(APP_NAME)

    # Swagger UI — served at /apidocs/ by Flasgger defaults
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "AI Flow API",
            "description": "Backend API for AI Flow — diagram generation and document processing.",
            "version": "1.0.0",
        },
        "host": "localhost:8000",
        "basePath": "/",
        "schemes": ["http"],
        "consumes": ["application/json"],
        "produces": ["application/json"],
    }
    # "auth": {} prevents Flasgger rendering Python None as literal `None` in JS
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": "apispec_1",
                "route": "/apispec_1.json",
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/",
        "auth": {},
    }
    Swagger(app, template=swagger_template, config=swagger_config)

    # Enable CORS
    CORS(app, resources={
        r"/*": {
            "origins": CORS_ORIGINS,
            "allow_headers": ["Content-Type", "multipart/form-data"],
            "methods": ["GET", "POST", "OPTIONS"]
        }
    })

    # Register blueprints
    from app.api import register_blueprints
    register_blueprints(app)

    return app
