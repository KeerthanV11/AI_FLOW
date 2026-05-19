import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadTemplate, uploadKnowledgeDocs } from '../api/uploadApi';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTS = ['.pdf', '.docx'];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

function generateSessionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'VAL-';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}": only PDF and DOCX files are accepted.`;
  }
  if (file.size > MAX_SIZE) {
    return `"${file.name}" exceeds the 20 MB size limit.`;
  }
  return null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [sessionId] = useState(generateSessionId);

  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [templateFile, setTemplateFile] = useState(null);

  const [knowledgeDragOver, setKnowledgeDragOver] = useState(false);
  const [templateDragOver, setTemplateDragOver] = useState(false);

  const [error, setError] = useState(null);

  const knowledgeInputRef = useRef(null);
  const templateInputRef = useRef(null);

  const canGenerate = knowledgeDocs.length > 0 && templateFile !== null;

  // --- File upload handlers ---

  const handleKnowledgeFiles = useCallback(async (files) => {
    setError(null);
    const validFiles = [];
    for (const file of files) {
      const err = validateFile(file);
      if (err) { setError(err); return; }
      validFiles.push(file);
    }
    if (!validFiles.length) return;

    try {
      await uploadKnowledgeDocs(validFiles);
      setKnowledgeDocs(prev => [...prev, ...validFiles.map(f => f.name)]);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleTemplateFile = useCallback(async (file) => {
    setError(null);
    const err = validateFile(file);
    if (err) { setError(err); return; }

    try {
      await uploadTemplate(file);
      setTemplateFile(file.name);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // --- Drag and drop ---

  const handleKnowledgeDrop = useCallback((e) => {
    e.preventDefault();
    setKnowledgeDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleKnowledgeFiles(files);
  }, [handleKnowledgeFiles]);

  const handleTemplateDrop = useCallback((e) => {
    e.preventDefault();
    setTemplateDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleTemplateFile(files[0]);
  }, [handleTemplateFile]);

  // --- Navigate to generate page ---

  const handleGenerate = () => {
    navigate('/generate');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Start a new validation run</h1>
            <p className="mt-2 text-sm text-gray-500 max-w-xl">
              Upload your source knowledge — SOPs, validation plans, and policies — alongside the
              regulatory template to be completed. Processing and review run securely on the backend.
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 mt-1 whitespace-nowrap shadow-sm">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-assisted · audit-logged
          </span>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Upload documents</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Add input knowledge documents (SOPs, policies) and the regulatory template to be completed.
            </p>
          </div>

          {/* Two drop zones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">

            {/* Knowledge Documents zone */}
            <div
              className={`flex flex-col rounded-lg border-2 border-dashed transition-colors min-h-48
                ${knowledgeDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
              onDragOver={(e) => { e.preventDefault(); setKnowledgeDragOver(true); }}
              onDragLeave={() => setKnowledgeDragOver(false)}
              onDrop={handleKnowledgeDrop}
            >
              <div className="flex flex-col items-center justify-center flex-1 px-4 py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">Knowledge documents</p>
                <p className="text-xs text-gray-400 mb-4">SOPs, policies, validation plans</p>

                {knowledgeDocs.length > 0 && (
                  <div className="w-full mb-4 space-y-1">
                    {knowledgeDocs.map((name, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate">{name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => knowledgeInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Upload knowledge documents
                </button>
                <p className="text-xs text-gray-400 mt-2">PDF or DOCX · up to 20 MB each</p>

                <input
                  ref={knowledgeInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length) handleKnowledgeFiles(files);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Output Template zone */}
            <div
              className={`flex flex-col rounded-lg border-2 border-dashed transition-colors min-h-48
                ${templateDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
              onDragOver={(e) => { e.preventDefault(); setTemplateDragOver(true); }}
              onDragLeave={() => setTemplateDragOver(false)}
              onDrop={handleTemplateDrop}
            >
              <div className="flex flex-col items-center justify-center flex-1 px-4 py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">Output template</p>
                <p className="text-xs text-gray-400 mb-4">Regulatory template to be completed</p>

                {templateFile && (
                  <div className="w-full mb-4">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="truncate">{templateFile}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => templateInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Upload output template
                </button>
                <p className="text-xs text-gray-400 mt-2">PDF or DOCX · up to 20 MB each</p>

                <input
                  ref={templateInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleTemplateFile(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Status Footer */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{knowledgeDocs.length}</span> knowledge
            {knowledgeDocs.length === 1 ? ' document' : ' documents'} ·{' '}
            <span className="font-medium text-gray-700">{templateFile ? 1 : 0}</span> template uploaded.{' '}
            Activity is logged under session{' '}
            <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{sessionId}</code>.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
              ${canGenerate
                ? 'bg-blue-900 text-white hover:bg-blue-800 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Continue to diagram
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
