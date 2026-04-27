import dagre from 'dagre';

/**
 * Compute vertical (TB) layout positions using dagre.
 *
 * @param {Array} nodes - Array of flow nodes
 * @param {Array} edges - Array of flow edges
 * @param {String} direction - Layout direction ('TB', 'BT', 'LR', 'RL')
 * @returns {Object} { nodes, edges } with computed positions
 */
export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const nodeWidth = 220;
  const nodeHeight = 60;

  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70, edgesep: 20 });

  // Add nodes with dimensions
  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Compute layout
  dagre.layout(g);

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
    };
  });

  // Build a position lookup for handle assignment
  const nodePositions = {};
  layoutedNodes.forEach((n) => { nodePositions[n.id] = n.position; });

  // Group edges by source and by target to distribute handles
  const edgesBySource = {};
  const edgesByTarget = {};
  edges.forEach((edge) => {
    (edgesBySource[edge.source] ??= []).push(edge);
    (edgesByTarget[edge.target] ??= []).push(edge);
  });

  // Pick source handle based on sibling count & target x-position
  const sourceHandles = ['source-left', 'source-center', 'source-right'];
  const targetHandles = ['target-left', 'target-center', 'target-right'];

  function assignHandles(group, posKey, handleList, useTarget) {
    if (group.length === 1) return [{ edge: group[0], handle: handleList[1] }]; // center
    // Sort by the other end's x-position so handles fan out naturally
    const sorted = [...group].sort((a, b) => {
      const idA = useTarget ? a.target : a.source;
      const idB = useTarget ? b.target : b.source;
      return (nodePositions[idA]?.x ?? 0) - (nodePositions[idB]?.x ?? 0);
    });
    if (sorted.length === 2) {
      return [
        { edge: sorted[0], handle: handleList[0] },
        { edge: sorted[1], handle: handleList[2] },
      ];
    }
    // 3+ edges: distribute evenly
    return sorted.map((e, i) => ({
      edge: e,
      handle: handleList[Math.min(Math.round((i / (sorted.length - 1)) * 2), 2)],
    }));
  }

  // Build per-edge handle assignments
  const edgeSourceHandle = {};
  const edgeTargetHandle = {};
  Object.values(edgesBySource).forEach((group) => {
    assignHandles(group, 'source', sourceHandles, true).forEach(({ edge, handle }) => {
      edgeSourceHandle[edge.id ?? `${edge.source}-${edge.target}`] = handle;
    });
  });
  Object.values(edgesByTarget).forEach((group) => {
    assignHandles(group, 'target', targetHandles, false).forEach(({ edge, handle }) => {
      edgeTargetHandle[edge.id ?? `${edge.source}-${edge.target}`] = handle;
    });
  });

  // Apply smoothstep edge type with distributed handles
  const layoutedEdges = edges.map((edge) => {
    const key = edge.id ?? `${edge.source}-${edge.target}`;
    return {
      ...edge,
      type: 'smoothstep',
      animated: false,
      sourceHandle: edgeSourceHandle[key] || 'source-center',
      targetHandle: edgeTargetHandle[key] || 'target-center',
      style: { stroke: '#000000', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#000000', width: 20, height: 20 },
      labelStyle: { fontSize: 11, fontWeight: 700, fill: '#1e293b' },
      labelBgStyle: { fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 1.5 },
      labelBgPadding: [8, 5],
      labelBgBorderRadius: 5,
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
