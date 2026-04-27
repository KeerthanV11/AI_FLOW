"""
Backend Configuration

Loads environment variables from .env file and provides
configuration for the Flask application.

Supports two modes:
  1. Env-var mode (default for REST API) — reads from .env / environment
  2. Programmatic mode (SDK) — accepts a dict via Config.from_dict()
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

# CORS Configuration
CORS_ORIGINS_STR = os.getenv("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_STR.split(",")]

# Validation
if not AZURE_OPENAI_API_KEY:
    raise ValueError("AZURE_OPENAI_API_KEY environment variable is not set. Please add it to .env file.")
if not AZURE_OPENAI_ENDPOINT:
    raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is not set. Please add it to .env file.")
if not AZURE_OPENAI_DEPLOYMENT_NAME:
    raise ValueError("AZURE_OPENAI_DEPLOYMENT_NAME environment variable is not set. Please add it to .env file.")

# Application Settings
APP_NAME = "Decision Tree Generator"


class Config:
    """
    Programmatic configuration container for SDK usage.

    Use Config.from_dict() to create a config object without
    relying on environment variables.
    """

    def __init__(self, api_key, endpoint, deployment_name,
                 api_version="2024-02-15-preview",
                 cors_origins=None):
        self.azure_openai_api_key = api_key
        self.azure_openai_endpoint = endpoint
        self.azure_openai_deployment_name = deployment_name
        self.azure_openai_api_version = api_version
        self.cors_origins = cors_origins or ["http://localhost:5173"]

    @classmethod
    def from_dict(cls, config_dict: dict) -> "Config":
        """
        Create a Config from a plain dictionary.

        Required keys: api_key, endpoint, deployment_name
        Optional keys: api_version, cors_origins

        Example::

            config = Config.from_dict({
                "api_key": "sk-...",
                "endpoint": "https://my-resource.openai.azure.com/",
                "deployment_name": "gpt-4o",
            })
        """
        required = ["api_key", "endpoint", "deployment_name"]
        missing = [k for k in required if k not in config_dict]
        if missing:
            raise ValueError(f"Missing required config keys: {missing}")

        return cls(
            api_key=config_dict["api_key"],
            endpoint=config_dict["endpoint"],
            deployment_name=config_dict["deployment_name"],
            api_version=config_dict.get("api_version", "2024-02-15-preview"),
            cors_origins=config_dict.get("cors_origins"),
        )

    @classmethod
    def from_env(cls) -> "Config":
        """Create a Config from the current module-level env-var values."""
        return cls(
            api_key=AZURE_OPENAI_API_KEY,
            endpoint=AZURE_OPENAI_ENDPOINT,
            deployment_name=AZURE_OPENAI_DEPLOYMENT_NAME,
            api_version=AZURE_OPENAI_API_VERSION,
            cors_origins=CORS_ORIGINS,
        )
