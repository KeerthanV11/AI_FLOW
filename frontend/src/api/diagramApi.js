/**
 * Diagram API
 *
 * Handles communication with the diagram generation endpoint.
 */

import { postJSON, getJSON } from './client';

// Request deduplication: track pending requests to prevent duplicates
const _pendingRequests = new Map();

/**
 * Generate a diagram from a description.
 * @param {string} description
 * @param {string} diagramType - 'decision_tree' or 'system_architecture'
 * @returns {Promise<object>} { nodes, edges }
 */
export async function generateDiagram(description, diagramType = 'decision_tree') {
  const requestKey = `generate_${diagramType}_${description}`;

  if (_pendingRequests.has(requestKey)) {
    console.warn('Duplicate request detected, returning pending request');
    return _pendingRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    try {
      return await postJSON('/api/diagram/generate', { description, diagram_type: diagramType });
    } finally {
      _pendingRequests.delete(requestKey);
    }
  })();

  _pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
}

/**
 * Upload the finalized diagram image (base64 data-URL) to the backend.
 * The backend stores it in generated_images/.
 * @param {string} dataUrl - base64 PNG data-URL
 * @param {string} diagramType
 * @returns {Promise<{status: string, filename: string, path: string}>}
 */
export async function saveImage(dataUrl, diagramType = 'diagram') {
  return postJSON('/api/image/save', { image: dataUrl, diagram_type: diagramType });
}

/**
 * Fetch the most recently generated diagram from the backend.
 * @returns {Promise<object>} { nodes, edges, diagram_type }
 */
export async function getCurrentDiagram() {
  return await getJSON('/api/diagram/current');
}

// Keep backward-compatible alias
export const generateTree = generateDiagram;
