"""
Abstract LLM Provider Base Class

Defines the interface that all LLM providers must implement.
The writer agent or diagram service calls providers through this interface,
making it easy to swap implementations without changing business logic.
"""

from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    def generate_json(self, prompt: str) -> str:
        """
        Send a prompt to the LLM and return a raw JSON string response.

        Args:
            prompt: The full prompt string to send to the LLM.

        Returns:
            Raw response string containing JSON from the LLM.

        Raises:
            Exception: If the API call fails after retries.
        """
        pass
