"""
Document Service (Placeholder)

Will orchestrate the writer agent to produce a full
Computer System Validation Plan DOCX with embedded diagrams.
"""


def generate_document(description: str, sections: list = None) -> bytes:
    """
    Generate a complete validation plan document.

    Args:
        description: High-level description of the system to validate.
        sections: Optional list of section names to include.

    Returns:
        DOCX file content as bytes.

    Raises:
        NotImplementedError: Until the writer agent is integrated.
    """
    raise NotImplementedError(
        "Document generation is not yet implemented. "
        "Integrate the writer agent in app/writer/agent.py."
    )
