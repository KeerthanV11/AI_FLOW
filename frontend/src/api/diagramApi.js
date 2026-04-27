/**
 * Diagram API
 *
 * Handles communication with the diagram generation endpoint.
 */

import { postJSON } from './client';

// Request deduplication: track pending requests to prevent duplicates
const _pendingRequests = new Map();

/**
 * Generate a diagram from a description.
 * @param {string} description - Natural language description
 * @param {string} diagramType - Diagram type (decision_tree, system_architecture, data_flow, process_flow)
 * @returns {Promise<object>} { nodes, edges }
 */
export async function generateDiagram(description, diagramType = 'decision_tree') {
  const requestKey = `generate_${diagramType}_${description}`;

  // Deduplication: return existing promise if identical request is in-flight
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

// Keep backward-compatible alias
export const generateTree = generateDiagram;
