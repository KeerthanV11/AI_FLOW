import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeToolbar,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElements } from '../../utils/layoutEngine';

// ─── Color map per node type ─────────────────────────────────────────────────

// Each node type gets a distinct color regardless of diagram type
const NODE_TYPE_COLORS = {
  // Decision Tree
  root:            '#4f46e5', // indigo-600
  decision:        '#7c3aed', // violet-600
  outcome:         '#059669', // emerald-600
  // System Architecture
  client:          '#2563eb', // blue-600
  service:         '#0891b2', // cyan-600
  database:        '#0d9488', // teal-600
  external:        '#9333ea', // purple-600
  // Data Flow
  external_entity: '#d97706', // amber-600
  process:         '#0891b2', // cyan-600
  data_store:      '#4f46e5', // indigo-600
  // Process Flow
  start:           '#16a34a', // green-700
  end:             '#dc2626', // red-600
};

// Edge stroke color per diagram type
const DIAGRAM_EDGE_COLORS = {
  decision_tree:       '#000000',
  system_architecture: '#000000',
  data_flow:           '#000000',
  process_flow:        '#000000',
};

function getNodeColor(type) {
  return NODE_TYPE_COLORS[type] || '#64748b';
}

// ─── Toolbar SVG Icons ────────────────────────────────────────────────────────

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const AddChildIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const AddNodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const RelayoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="6" height="4" rx="1" />
    <rect x="9" y="10" width="6" height="4" rx="1" />
    <rect x="16" y="17" width="6" height="4" rx="1" />
    <path d="M5 7v3" />
    <path d="M12 14v1" />
    <path d="M5 10h7M12 15h7" />
  </svg>
);

// ─── Editable Custom Node ──────────────────────────────────────────────────────

const CustomNode = ({ id, data, type, selected }) => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef(null);

  useEffect(() => { setEditValue(data.label); }, [data.label]);
  useEffect(() => {
    if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed) {
      setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: trimmed } } : n));
    } else {
      setEditValue(data.label);
    }
    setIsEditing(false);
  }, [editValue, id, data.label, setNodes]);

  const handleDelete = useCallback(() => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
  }, [id, setNodes, setEdges]);

  const handleAddChild = useCallback(() => {
    const newId = `node-${Date.now()}`;
    setNodes(nds => {
      const parent = nds.find(n => n.id === id);
      return [...nds, {
        id: newId,
        type: 'outcome',
        position: {
          x: (parent?.position?.x ?? 200) + (Math.random() - 0.5) * 160,
          y: (parent?.position?.y ?? 0) + 160,
        },
        data: { label: 'New Node' },
      }];
    });
    setEdges(eds => [...eds, {
      id: `e-${id}-${newId}`,
      source: id,
      target: newId,
      type: 'smoothstep',
    }]);
  }, [id, setNodes, setEdges]);

  // Pick border color based on the node's semantic type
  const borderColor = getNodeColor(type);

  return (
    <>
      {/* ── Toolbar (on select) ── */}
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
          className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors border-r border-slate-100"
            title="Edit label (or double-click)"
          >
            <EditIcon /> <span className="font-medium">Edit</span>
          </button>
          <button
            onClick={handleAddChild}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors border-r border-slate-100"
            title="Add child node"
          >
            <AddChildIcon /> <span className="font-medium">Add Child</span>
          </button>
          {type !== 'root' && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete node (or press Delete)"
            >
              <DeleteIcon /> <span className="font-medium">Remove</span>
            </button>
          )}
        </div>
      </NodeToolbar>

      {/* ── Node card ── */}
      <div
        onDoubleClick={() => !isEditing && setIsEditing(true)}
        style={{
          background: '#ffffff',
          border: `4px solid ${borderColor}`,
          borderRadius: '10px',
          minWidth: '140px',
          maxWidth: '240px',
          boxShadow: selected
            ? `0 0 0 2px ${borderColor}40, 0 4px 16px rgba(0,0,0,0.10)`
            : '0 2px 10px rgba(0,0,0,0.06)',
          cursor: 'default',
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
          overflow: 'hidden',
        }}
      >
        {/* Target handles: left, center, right (invisible) */}
        <Handle
          id="target-left"
          type="target"
          position={Position.Top}
          style={{ background: 'transparent', width: '1px', height: '1px', border: 'none', left: '25%', opacity: 0 }}
        />
        <Handle
          id="target-center"
          type="target"
          position={Position.Top}
          style={{ background: 'transparent', width: '1px', height: '1px', border: 'none', opacity: 0 }}
        />
        <Handle
          id="target-right"
          type="target"
          position={Position.Top}
          style={{ background: 'transparent', width: '1px', height: '1px', border: 'none', left: '75%', opacity: 0 }}
        />
        <div style={{ padding: '10px 14px' }}>
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { setEditValue(data.label); setIsEditing(false); }
                e.stopPropagation();
              }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${borderColor}`,
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                fontWeight: 500,
                color: '#1e293b',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', lineHeight: '1.45', display: 'block' }}>
              {data.label}
            </span>
          )}
        </div>
        {/* Source handles: left, center, right (invisible) */}
        <Handle
          id="source-left"
          type="source"
          position={Position.Bottom}
          style={{ background: 'transparent', width: '1px', height: '1px', border: 'none', left: '25%', opacity: 0 }}
        />
        <Handle
          id="source-center"
          type="source"
          position={Position.Bottom}
          style={{ background: 'transparent', width: '1px', height: '1px', border: 'none', opacity: 0 }}
        />
        <Handle
          id="source-right"
          type="source"
          position={Position.Bottom}
          style={{ background: 'transparent', width: '1px', height: '1px', border: 'none', left: '75%', opacity: 0 }}
        />
      </div>
    </>
  );
};

// Defined outside component so the reference is stable
// All node types across all diagram types are registered here
const nodeTypes = {
  // Decision Tree
  root:            (props) => <CustomNode {...props} type="root" />,
  decision:        (props) => <CustomNode {...props} type="decision" />,
  outcome:         (props) => <CustomNode {...props} type="outcome" />,
  // System Architecture
  client:          (props) => <CustomNode {...props} type="client" />,
  service:         (props) => <CustomNode {...props} type="service" />,
  database:        (props) => <CustomNode {...props} type="database" />,
  external:        (props) => <CustomNode {...props} type="external" />,
  // Data Flow
  external_entity: (props) => <CustomNode {...props} type="external_entity" />,
  process:         (props) => <CustomNode {...props} type="process" />,
  data_store:      (props) => <CustomNode {...props} type="data_store" />,
  // Process Flow
  start:           (props) => <CustomNode {...props} type="start" />,
  end:             (props) => <CustomNode {...props} type="end" />,
};

// ─── Main Diagram Component ────────────────────────────────────────────────────

function DecisionTreeDiagram({ nodes: propNodes, edges: propEdges, diagramType = 'decision_tree' }) {
  const edgeColor = DIAGRAM_EDGE_COLORS[diagramType] || '#000000';

  // Compute initial layout once on mount (key prop in App.jsx forces remount on new generation)
  const initialLayout = useMemo(() => {
    if (!propNodes || propNodes.length === 0) return { nodes: [], edges: [] };
    return getLayoutedElements(propNodes, propEdges, 'TB');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — initial value only

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);
  const { fitView } = useReactFlow();

  // Fit view after initial layout renders
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.2 }), 150);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect two nodes by dragging between handles
  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  // Add a free-floating node from the panel button
  const handleAddNode = useCallback(() => {
    const id = `node-${Date.now()}`;
    setNodes(nds => [...nds, {
      id,
      type: 'decision',
      position: { x: 80 + Math.random() * 200, y: 80 + Math.random() * 160 },
      data: { label: 'New Node' },
    }]);
  }, [setNodes]);

  // Re-run dagre on current nodes/edges
  const handleResetLayout = useCallback(() => {
    if (nodes.length === 0) return;
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges, 'TB');
    setNodes(ln);
    setEdges(le);
    setTimeout(() => fitView({ padding: 0.2 }), 150);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      deleteKeyCode={['Delete', 'Backspace']}
      multiSelectionKeyCode={['Control', 'Meta']}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        type: 'smoothstep',
        style: { stroke: edgeColor, strokeWidth: 1.8 },
        markerEnd: { type: 'arrowclosed', color: edgeColor, width: 18, height: 18 },
      }}
    >
      <Background variant="lines" gap={24} size={1} color="#e8edf3" />
      <Controls className="!shadow-md !border !border-slate-2000 !rounded-lg" />
      <MiniMap
        nodeColor={(node) => getNodeColor(node.type)}
        maskColor="rgba(241, 245, 249, 0.7)"
        className="!shadow-md !border !border-slate-2000 !rounded-lg"
      />

      {/* ── Edit controls panel (top-right) ── */}
      <Panel position="top-right">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAddNode}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-2000 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            title="Add a new standalone node"
          >
            <AddNodeIcon /> Add Node
          </button>
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-2000 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            title="Re-run auto-layout"
          >
            <RelayoutIcon /> Auto Layout
          </button>
        </div>
      </Panel>

      {/* ── Hint bar (bottom-center) ── */}
      <Panel position="bottom-center">
        <div
          className="flex items-center gap-3 px-4 py-2 text-xs text-slate-500 select-none"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226,232,240,0.8)',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <span>Click to select</span>
          <span className="text-slate-300">·</span>
          <span>Double-click to rename</span>
          <span className="text-slate-300">·</span>
          <span>Drag handles to connect</span>
          <span className="text-slate-300">·</span>
          <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px', fontSize: '11px' }}>Del</kbd><span> to remove</span>
        </div>
      </Panel>
    </ReactFlow>
  );
}

export default DecisionTreeDiagram;
