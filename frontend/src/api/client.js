/**
 * Shared API Client
 *
 * Centralised fetch configuration used by all API modules.
 * When the writer agent endpoint is added, it uses the same base URL + error handling.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Make a JSON GET request to the backend.
 *
 * @param {string} path - The endpoint path
 * @returns {Promise<object>} Parsed response JSON
 */
export async function getJSON(path) {
  try {
    const response = await fetch(`${API_URL}${path}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
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

/**
 * Make a multipart/form-data POST request (used for file uploads).
 *
 * @param {string} path - The endpoint path
 * @param {FormData} formData - The FormData object to send
 * @returns {Promise<object>} Parsed response JSON
 */
export async function postFormData(path, formData) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — browser sets it with boundary automatically
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
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
