import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import DecisionTreeDiagram from '../components/diagram/DecisionTreeDiagram';
import ExportButtons from '../components/ui/ExportButtons';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getCurrentDiagram } from '../api/diagramApi';
import { postJSON } from '../api/client';

const DIAGRAM_LABELS = {
  decision_tree: 'Decision Tree',
  system_architecture: 'System Architecture',
};

export default function EditorPage() {
  const navigate = useNavigate();
  const flowRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [diagramType, setDiagramType] = useState('decision_tree');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [finalizedImage, setFinalizedImage] = useState(null);
  const [embedStatus, setEmbedStatus] = useState(null); // 'sending' | 'success' | 'error'
  const [embedError, setEmbedError] = useState(null);

  const fetchDiagram = () => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    setNodes([]);
    setEdges([]);

    getCurrentDiagram()
      .then((data) => {
        if (cancelled) return;
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setDiagramType(data.diagram_type || 'decision_tree');
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  };

  useEffect(() => {
    return fetchDiagram();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmbed = async () => {
    setEmbedStatus('sending');
    setEmbedError(null);
    try {
      await postJSON('/api/document/embed', { nodes, edges, diagram_type: diagramType });
      setEmbedStatus('success');
    } catch (err) {
      setEmbedStatus('error');
      setEmbedError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Edit Diagram</h1>
            {!loading && !fetchError && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">
                {DIAGRAM_LABELS[diagramType] || diagramType}
              </span>
            )}
          </div>

          {/* Finalize & Embed button */}
          {!loading && !fetchError && (
            <button
              type="button"
              onClick={handleEmbed}
              disabled={embedStatus === 'sending'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                ${embedStatus === 'sending'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800 cursor-pointer'}`}
            >
              {embedStatus === 'sending' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Finalize &amp; Embed in Document
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {embedStatus === 'success' && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            Diagram sent to backend successfully. Document embedding will be available in a future update.
          </div>
        </div>
      )}
      {embedStatus === 'error' && embedError && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {embedError}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-4">
        {loading && <LoadingSpinner />}

        {fetchError && (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <div className="px-6 py-8 bg-white border border-gray-200 rounded-xl shadow-sm text-center max-w-lg">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-gray-800 font-semibold mb-2">No diagram generated yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Generate a diagram first by describing it on the generate page, then return here to view and edit the result.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/generate')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  Go to generate page
                </button>
                <button
                  type="button"
                  onClick={fetchDiagram}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !fetchError && nodes.length > 0 && (
          <>
            {/* Diagram */}
            <div
              ref={flowRef}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              style={{ height: '600px' }}
            >
              <ReactFlowProvider>
                <DecisionTreeDiagram
                  nodes={nodes}
                  edges={edges}
                  diagramType={diagramType}
                />
              </ReactFlowProvider>
            </div>

            {/* Export buttons */}
            <div className="flex gap-3 justify-center">
              <ExportButtons
                flowRef={flowRef}
                description=""
                treeData={{ nodes, edges }}
                finalizedImage={finalizedImage}
                onFinalize={setFinalizedImage}
                diagramType={diagramType}
              />
            </div>

            <p className="text-center text-xs text-gray-400">
              Click any node to edit · Drag handles to connect · Press <kbd className="bg-gray-100 border border-gray-300 px-1 rounded text-xs">Del</kbd> to remove
            </p>
          </>
        )}
      </div>
    </div>
  );
}
