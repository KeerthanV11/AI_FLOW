/**
 * Document API (Placeholder)
 *
 * Will call the writer agent endpoint once it's implemented:
 *   POST /api/document/generate
 */

import { postJSON } from './client';

/**
 * Generate a full Computer System Validation Plan document.
 *
 * @param {string} description - System description
 * @param {object} [config] - Optional configuration (company name, sections, etc.)
 * @returns {Promise<Blob>} DOCX file as a Blob
 */
export async function generateDocument(description, config = {}) {
  return postJSON('/api/document/generate', { description, ...config });
}
