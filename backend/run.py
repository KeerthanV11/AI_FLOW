"""
Entry Point

Run the Flask application:
    python run.py
"""

import logging
from app import create_app

# Configure logging
logging.basicConfig(level=logging.INFO)

app = create_app()

if __name__ == "__main__":
    print("\n" + "=" * 55)
    print("  AI Flow Backend")
    print("  API:     http://localhost:8000")
    print("  Swagger: http://localhost:8000/apidocs")
    print("=" * 55 + "\n")
    app.run(host="0.0.0.0", port=8000, debug=True, threaded=True)
