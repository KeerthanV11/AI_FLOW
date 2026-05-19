import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { exportAsDocx } from '../utils/exportDocx';

const DIAGRAM_TYPE_TITLES = {
  decision_tree: 'Decision Tree Report',
  system_architecture: 'System Architecture Report',
  data_flow: 'Data Flow Report',
  process_flow: 'Process Flow Report',
};

export default function DocumentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  // If landed here without data, redirect back
  if (!state?.image) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6 py-12 bg-white rounded-xl shadow-sm border border-gray-200 max-w-md">
          <p className="text-gray-700 font-semibold mb-2">No document to preview</p>
          <p className="text-gray-500 text-sm mb-6">
            Generate and finalize a diagram first.
          </p>
          <button
            type="button"
            onClick={() => navigate('/generate')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
          >
            Go to generate page
          </button>
        </div>
      </div>
    );
  }

  const { image, treeData, diagramType } = state;
  const defaultTitle = DIAGRAM_TYPE_TITLES[diagramType] || 'Diagram Report';
  const defaultDescription = state.description || '';

  // Editable document fields
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const handleDownload = async () => {
    try {
      setExporting(true);
      setExportDone(false);
      const filename = `${(diagramType || 'diagram').replace(/_/g, '-')}-report.docx`;
      await exportAsDocx(description, treeData, image, filename, diagramType, title);
      setExportDone(true);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate document. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to diagram
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-700">Document Preview</span>
          </div>

          <div className="flex items-center gap-3">
            {exportDone && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Downloaded
              </span>
            )}
            <button
              type="button"
              onClick={handleDownload}
              disabled={exporting}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors
                ${exporting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800 cursor-pointer'}`}
            >
              {exporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download as Word (.docx)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Document preview */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">

        {/* Left: edit controls panel */}
        <aside className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-20">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Document fields</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Document title"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono"
                  placeholder="Description of the diagram…"
                />
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Edit the title and description above. The diagram image is embedded from your finalized diagram. Click <strong>Download as Word</strong> to generate the .docx.
              </p>
            </div>
          </div>
        </aside>

        {/* Right: A4 paper preview */}
        <div className="flex-1 flex justify-center">
          <div
            className="bg-white w-full max-w-3xl shadow-xl rounded-sm"
            style={{
              minHeight: '297mm',
              padding: '25mm 20mm',
              fontFamily: 'Calibri, "Trebuchet MS", sans-serif',
              boxShadow: '0 4px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* ── Title ── */}
            <div
              className="text-center mb-2"
              style={{
                borderBottom: '3px solid #4f46e5',
                paddingBottom: '12px',
                marginBottom: '24px',
              }}
            >
              <h1
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#1e1b4b',
                  letterSpacing: '-0.3px',
                  margin: 0,
                }}
              >
                {title || 'Untitled Report'}
              </h1>
            </div>

            {/* ── Description Section ── */}
            <section className="mb-8">
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                Description
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#374151',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {description || <span className="italic text-gray-400">No description provided.</span>}
              </p>
            </section>

            {/* ── Diagram Section ── */}
            <section>
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                {(DIAGRAM_TYPE_TITLES[diagramType] || 'Diagram').replace(' Report', '')}
              </h2>
              <div className="flex justify-center">
                <img
                  src={image}
                  alt="Finalized diagram"
                  style={{
                    maxWidth: '100%',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </section>

            {/* ── Footer ── */}
            <div
              className="text-center mt-16"
              style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: '12px',
                fontSize: '10px',
                color: '#9ca3af',
              }}
            >
              Generated by AI Flow · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
