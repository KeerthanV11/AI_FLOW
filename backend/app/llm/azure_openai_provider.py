"""
Azure OpenAI LLM Provider

Implements the LLMProvider interface using the Azure OpenAI API.
"""

import time
from openai import AzureOpenAI
from app.llm.base import LLMProvider
from app.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_DEPLOYMENT_NAME,
)
from app.utils.token_tracker import record_usage


class AzureOpenAIProvider(LLMProvider):
    """Azure OpenAI API provider with rate limiting and retry logic."""

    def __init__(self, api_key=None, endpoint=None, deployment_name=None, api_version=None):
        self._client = AzureOpenAI(
            api_key=api_key or AZURE_OPENAI_API_KEY,
            api_version=api_version or AZURE_OPENAI_API_VERSION,
            azure_endpoint=endpoint or AZURE_OPENAI_ENDPOINT,
        )
        self._deployment_name = deployment_name or AZURE_OPENAI_DEPLOYMENT_NAME
        self._last_request_time = 0
        self._min_request_interval = 0.1  # 100ms minimum between requests

    def generate_json(self, prompt: str) -> str:
        """
        Send a prompt to Azure OpenAI and return the raw JSON string.

        Includes rate limiting and retry with exponential backoff.
        """
        # Rate limiting: enforce minimum interval between requests
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        if time_since_last < self._min_request_interval:
            time.sleep(self._min_request_interval - time_since_last)

        max_retries = 2
        retry_delay = 1.0

        for attempt in range(max_retries):
            try:
                self._last_request_time = time.time()

                response = self._client.chat.completions.create(
                    model=self._deployment_name,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_completion_tokens=2048,
                    response_format={"type": "json_object"},
                )

                # Track token usage and cost
                try:
                    if response.usage:
                        record_usage(
                            input_tokens=response.usage.prompt_tokens,
                            output_tokens=response.usage.completion_tokens,
                            model=self._deployment_name,
                        )
                except Exception:
                    pass  # never let tracking break generation

                content = response.choices[0].message.content
                if not content:
                    raise Exception("Empty response from Azure OpenAI (content was None/empty — possible content filter or finish_reason issue)")

                return content

            except Exception as e:
                error_msg = str(e).lower()

                # Rate limit — wait and retry
                if "rate_limit" in error_msg or "429" in error_msg:
                    if attempt < max_retries - 1:
                        print(f"Rate limit hit, waiting {retry_delay}s before retry...")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue

                raise Exception(f"Failed to generate from Azure OpenAI API: {str(e)}")

        raise Exception("Failed to generate after retries")
