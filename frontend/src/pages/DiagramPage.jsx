import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import InputForm from '../components/diagram/InputForm';
import DecisionTreeDiagram from '../components/diagram/DecisionTreeDiagram';
import ExportButtons from '../components/ui/ExportButtons';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { generateDiagram } from '../api/diagramApi';

export default function DiagramPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isInMainFlow = location.pathname === '/generate';

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationId, setGenerationId] = useState(0);
  const [description, setDescription] = useState('');
  const [treeData, setTreeData] = useState(null);
  const [diagramType, setDiagramType] = useState('decision_tree');
  const flowRef = useRef(null);

  const handleFinalizeAndNavigate = (dataUrl) => {
    navigate('/document', {
      state: { image: dataUrl, description, treeData, diagramType },
    });
  };

  const handleSubmit = async (desc, type) => {
    setLoading(true);
    setError(null);
    setTreeData(null);
    setDescription(desc);
    setDiagramType(type);
    try {
      const result = await generateDiagram(desc, type);
      setNodes(result.nodes);
      setEdges(result.edges);
      setTreeData(result);
      setGenerationId(prev => prev + 1);
    } catch (err) {
      setError(err.message || 'Failed to generate diagram');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isInMainFlow && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to uploads
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Describe your diagram</h1>
          <p className="mt-2 text-gray-600">
            Select a diagram type, write a natural-language description, and generate an interactive diagram you can edit and export.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <InputForm onSubmit={handleSubmit} disabled={loading} />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {nodes.length > 0 && (
          <div className="space-y-6">
            <div
              ref={flowRef}
              className="bg-white rounded-lg shadow-md overflow-hidden"
              style={{ height: '600px', minHeight: '600px' }}
            >
              <ReactFlowProvider key={generationId}>
                <DecisionTreeDiagram nodes={nodes} edges={edges} diagramType={diagramType} />
              </ReactFlowProvider>
            </div>

            <div className="flex gap-4 justify-center">
              <ExportButtons
                flowRef={flowRef}
                description={description}
                treeData={treeData}
                finalizedImage={null}
                onFinalize={handleFinalizeAndNavigate}
                diagramType={diagramType}
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
              Edit the diagram by clicking nodes — drag to reposition, use the toolbar to add or remove nodes.
              <span className="block mt-1 text-blue-600">
                When you&rsquo;re happy with the layout, click <strong>Finalize Image</strong> to proceed to the document preview.
              </span>
            </div>
          </div>
        )}

        {!loading && nodes.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a diagram type and describe what you need to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}