/**
 * Upload API
 *
 * Handles file upload communication with the backend.
 */

import { postFormData, getJSON, postJSON } from './client';

/**
 * Upload the output template file (PDF or DOCX).
 * Replaces any previously uploaded template.
 * @param {File} file
 * @returns {Promise<{status: string, filename: string}>}
 */
export async function uploadTemplate(file) {
  const formData = new FormData();
  formData.append('file', file);
  return await postFormData('/api/upload/template', formData);
}

/**
 * Upload one or more knowledge / source documents (PDF or DOCX).
 * Files are appended to the existing source_data_files directory.
 * @param {File[]} files
 * @returns {Promise<{status: string, uploaded: string[], count: number}>}
 */
export async function uploadKnowledgeDocs(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  return await postFormData('/api/upload/knowledge', formData);
}

/**
 * Get the current upload status (what files are uploaded).
 * @returns {Promise<{template_file: string|null, knowledge_files: string[], knowledge_count: number}>}
 */
export async function getUploadStatus() {
  return await getJSON('/api/upload/status');
}

/**
 * Trigger backend processing + diagram generation from uploaded files.
 * @returns {Promise<{status: string, diagram_type: string, node_count: number, edge_count: number}>}
 */
export async function triggerGeneration() {
  return await postJSON('/api/process/generate', {});
}
