"""
LLM Provider Factory

Returns the configured LLM provider instance.
Currently supports: azure_openai
"""

from app.llm.base import LLMProvider
from app.llm.azure_openai_provider import AzureOpenAIProvider

# Singleton instance (reused across requests)
_provider_instance = None


def get_provider() -> LLMProvider:
    """
    Return the LLM provider instance (singleton).

    Returns:
        An initialized LLMProvider implementation.
    """
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = AzureOpenAIProvider()
    return _provider_instance
