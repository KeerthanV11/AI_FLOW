import { useState, useRef } from 'react';
import InputForm from './components/diagram/InputForm';
import DecisionTreeDiagram from './components/diagram/DecisionTreeDiagram';
import ExportButtons from './components/export/ExportButtons';
import LoadingSpinner from './components/diagram/LoadingSpinner';
import { generateDiagram } from './api/diagramApi';
import { ReactFlowProvider } from 'reactflow';

const DIAGRAM_TYPE_LABELS = {
  decision_tree: 'Decision Tree',
  system_architecture: 'System Architecture',
  data_flow: 'Data Flow',
  process_flow: 'Process Flow',
};

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagramReady, setDiagramReady] = useState(false);
  const [generationId, setGenerationId] = useState(0);
  const [description, setDescription] = useState('');
  const [finalizedImage, setFinalizedImage] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [diagramType, setDiagramType] = useState('decision_tree');
  const flowRef = useRef(null);

  // Handle form submission
  const handleSubmit = async (desc, type) => {
    setLoading(true);
    setError(null);
    setDiagramReady(false);
    setFinalizedImage(null);
    setTreeData(null);
    setDescription(desc);
    setDiagramType(type);

    try {
      const result = await generateDiagram(desc, type);
      setNodes(result.nodes);
      setEdges(result.edges);
      setTreeData(result);
      setGenerationId(prev => prev + 1);
      setDiagramReady(true);
    } catch (err) {
      setError(err.message || 'Failed to generate diagram');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Flow — Diagram Generator</h1>
          <p className="mt-2 text-gray-600">Convert natural language to interactive diagrams</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <InputForm onSubmit={handleSubmit} disabled={loading} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && <LoadingSpinner />}

        {/* Diagram Section */}
        {nodes.length > 0 && (
          <div className="space-y-6">
            {/* Diagram Container */}
            <div
              ref={flowRef}
              className="bg-white rounded-lg shadow-md overflow-hidden"
              style={{ height: '600px', minHeight: '600px' }}
            >
              <ReactFlowProvider key={generationId}>
                <DecisionTreeDiagram nodes={nodes} edges={edges} diagramType={diagramType} />
              </ReactFlowProvider>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-4 justify-center">
              <ExportButtons
                flowRef={flowRef}
                description={description}
                treeData={treeData}
                finalizedImage={finalizedImage}
                onFinalize={setFinalizedImage}
                diagramType={diagramType}
              />
            </div>

            {/* Info Message */}
            <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
              💡 Edit the diagram first, then click <strong>Finalize Image</strong> to lock in your changes.
              <span className="block mt-1 text-blue-600">
                📄 After finalizing, use <strong>Download as Word</strong> to get a .docx with your description and diagram.
              </span>
              <span className="block mt-1 text-blue-600">
                ✏️ <strong>Editing:</strong> click any node to select it, then use the toolbar — or double-click to rename, drag handles to connect, press <kbd className="bg-blue-100 px-1 rounded">Del</kbd> to remove.
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && nodes.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <p className="text-gray-500">Select a diagram type and describe what you need to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
