/**
 * Shared API Client
 *
 * Centralised fetch configuration used by all API modules.
 * When the writer agent endpoint is added, it uses the same base URL + error handling.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Make a JSON POST request to the backend.
 *
 * @param {string} path - The endpoint path (e.g. '/api/diagram/generate')
 * @param {object} body - The JSON body to send
 * @returns {Promise<object>} Parsed response JSON
 */
export async function postJSON(path, body) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.detail ||
        (Array.isArray(errorData.detail)
          ? errorData.detail[0]?.msg
          : 'Unknown error');
      throw new Error(errorMessage || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Failed to connect to backend. Make sure it's running on " + API_URL
      );
    }
    throw error;
  }
}

export { API_URL };
