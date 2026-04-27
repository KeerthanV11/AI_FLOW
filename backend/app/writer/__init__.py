"""
Writer Agent (Placeholder)

This module is the integration point for the writer agent that will:
  1. Create DOCX template structure (headings, tables, headers/footers)
  2. Generate section text (scope, risk assessment, test strategy, etc.)
  3. Fill in boilerplate fields (company name, system name, dates)
  4. Embed diagram(s) into the DOCX

The writer agent will use app.services.diagram_service to generate
diagrams and embed them into the final document.

Integration checklist:
  - Implement WriterAgent class below
  - Wire it into app/services/document_service.py
  - Update app/api/document_routes.py to call document_service
"""


class WriterAgent:
    """
    Placeholder for the writer agent.

    When implementing, this class should:
      - Accept a system description and configuration
      - Generate a DOCX template
      - Call the LLM to fill each section
      - Call diagram_service to generate and embed diagrams
      - Return the completed DOCX as bytes
    """

    def generate_plan(self, system_description: str, config: dict = None) -> bytes:
        """
        Generate a complete Computer System Validation Plan.

        Args:
            system_description: Description of the system to validate.
            config: Optional configuration (company name, dates, sections, etc.)

        Returns:
            DOCX file content as bytes.
        """
        raise NotImplementedError("WriterAgent.generate_plan() is not yet implemented.")
