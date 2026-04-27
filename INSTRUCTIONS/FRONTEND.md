# FRONTEND.md — Frontend Architecture & Implementation Guide

## Overview

The frontend is a **React + Vite** application that provides a user-friendly interface for generating and visualizing decision tree diagrams. It fetches structured JSON from the backend and uses **React Flow** with **dagre** layout engine to render interactive, vertical flowcharts. Users can download diagrams as PNG or SVG images.

## Architecture Layers

```
User Input (TextArea)
    ↓
InputForm (submit description)
    ↓
API Call (generateTree.js)
    ↓
Backend (POST /api/generate)
    ↓
JSON Response {nodes, edges}
    ↓
Layout Engine (dagre, TB direction)
    ↓
React Flow Renderer
    ↓
Export Buttons (html-to-image)
    ↓
Download PNG/SVG
```

## Component Hierarchy

```
App (root state, orchestration)
├── InputForm (on submit → call API)
├── LoadingSpinner (while loading)
├── DecisionTreeDiagram (renders React Flow)
│   ├── ReactFlow (viewport/controls)
│   ├── Background
│   ├── Controls
│   ├── MiniMap
│   └── Custom Node Styles
└── ExportButtons (PNG/SVG download)
```

---

## File Structure

```
frontend/
├── public/                        # Static assets
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Root component
│   ├── index.css                 # Tailwind imports
│   ├── components/
│   │   ├── InputForm.jsx         # User input textarea
│   │   ├── DecisionTreeDiagram.jsx
│   │   ├── ExportButtons.jsx     # Download buttons
│   │   └── LoadingSpinner.jsx    # Loading indicator
│   ├── utils/
│   │   ├── layoutEngine.js       # dagre layout
│   │   └── exportImage.js        # html-to-image export
│   └── api/
│       └── generateTree.js       # API client
├── index.html
├── package.json
├── vite.config.js                # Vite config
├── tailwind.config.js            # Tailwind config
├── postcss.config.js             # PostCSS config
├── .env                          # Frontend env (git-ignored)
└── .env.example                  # Template (committed)
```

---

## File-by-File Responsibilities

### `App.jsx`

**Purpose**: Root component. Manages overall state, orchestrates API calls, handles auto-download.

**State**:
- `nodes` — array of flow nodes from API
- `edges` — array of flow edges from API
- `loading` — boolean, shows spinner during generation
- `error` — string, error message if request fails
- `diagramReady` — boolean, triggers auto-download

**Key Features**:
- `handleSubmit(description)` — calls API, sets nodes/edges, triggers auto-download
- `useEffect` on `diagramReady` — auto-downloads PNG after 500ms delay
- `useRef` to DecisionTreeDiagram wrapper — passed to ExportButtons for image capture
- Layout: InputForm at top, diagram + export buttons below

**Pseudocode**:
```jsx
export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagramReady, setDiagramReady] = useState(false);
  const flowRef = useRef(null);
  
  const handleSubmit = async (description) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateTree(description);
      setNodes(result.nodes);
      setEdges(result.edges);
      setDiagramReady(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-download PNG after diagram renders
  useEffect(() => {
    if (diagramReady) {
      setTimeout(() => {
        exportAsPng(flowRef.current, "decision-tree.png");
      }, 500);
    }
  }, [diagramReady]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <InputForm onSubmit={handleSubmit} disabled={loading} />
      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} />}
      {nodes.length > 0 && (
        <>
          <DecisionTreeDiagram ref={flowRef} nodes={nodes} edges={edges} />
          <ExportButtons flowRef={flowRef} />
        </>
      )}
    </div>
  );
}
```

---

### `components/InputForm.jsx`

**Purpose**: Form for user to describe decision tree. Collects description and submits to parent.

**Props**:
- `onSubmit(description)` — callback when submit button clicked
- `disabled` — boolean, disables input/button during loading

**Features**:
- Textarea with placeholder example
- Min/max character validation
- Submit button with loading state
- Character counter
- Clear button

**Example**:
```jsx
export default function InputForm({ onSubmit, disabled }) {
  const [description, setDescription] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      alert("Description must be at least 10 characters");
      return;
    }
    onSubmit(description);
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your decision tree... E.g., Should I go outside? If raining, stay inside. If sunny, go to park."
        className="w-full h-32 p-3 border rounded"
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        Generate Diagram
      </button>
    </form>
  );
}
```

---

### `components/DecisionTreeDiagram.jsx`

**Purpose**: Renders the interactive React Flow diagram with dagre auto-layout.

**Props**:
- `nodes` — array of FlowNode objects from API
- `edges` — array of FlowEdge objects from API

**Key Logic**:
1. Receive raw nodes/edges from props
2. Run through `getLayoutedElements(nodes, edges, 'TB')` to compute positions using dagre
3. Render with React Flow, including Controls, MiniMap, Background
4. Custom node styling: decision (blue), outcome (green), root (purple)
5. Call `fitView()` on initial render to center/zoom diagram
6. Expose wrapper div as `ref` for image export

**Features**:
- Vertical (TB) layout via dagre
- Interactive pan/zoom via Controls
- Mini map for navigation
- Custom node styling by type
- Edge labels visible
- Auto-fit view on load

**Pseudocode**:
```jsx
import ReactFlow, { Controls, MiniMap, Background, useReactFlow } from 'reactflow';
import { getLayoutedElements } from '../utils/layoutEngine';

const DecisionTreeDiagram = forwardRef(({ nodes, edges }, ref) => {
  const { fitView } = useReactFlow();
  
  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(nodes, edges, 'TB'),
    [nodes, edges]
  );
  
  // Fit view on first render
  useEffect(() => {
    setTimeout(() => fitView(), 100);
  }, [layoutedNodes]);
  
  return (
    <div ref={ref} style={{ width: '100%', height: '600px' }}>
      <ReactFlow nodes={layoutedNodes} edges={layoutedEdges}>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
});
```

---

### `components/ExportButtons.jsx`

**Purpose**: PNG and SVG download buttons. Uses html-to-image to capture React Flow DOM.

**Props**:
- `flowRef` — ref to DecisionTreeDiagram wrapper div

**Buttons**:
1. Download PNG
2. Download SVG

**Logic**:
- Click PNG → call `exportAsPng(flowRef.current, filename)`
- Click SVG → call `exportAsSvg(flowRef.current, filename)`

**Example**:
```jsx
import { exportAsPng, exportAsSvg } from '../utils/exportImage';

export default function ExportButtons({ flowRef }) {
  const handleDownloadPng = () => {
    exportAsPng(flowRef.current, 'decision-tree.png');
  };
  
  const handleDownloadSvg = () => {
    exportAsSvg(flowRef.current, 'decision-tree.svg');
  };
  
  return (
    <div className="flex gap-4 p-6">
      <button onClick={handleDownloadPng}>Download as PNG</button>
      <button onClick={handleDownloadSvg}>Download as SVG</button>
    </div>
  );
}
```

---

### `components/LoadingSpinner.jsx`

**Purpose**: Loading indicator shown while API request is in progress.

**Simple implementation**:
```jsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      <span className="ml-4">Generating diagram...</span>
    </div>
  );
}
```

---

### `utils/layoutEngine.js`

**Purpose**: Compute vertical (TB) layout positions using dagre. Converts raw nodes/edges to positioned nodes/edges.

**Key Function**:
```javascript
import dagre from 'dagre';

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  // Create dagre graph
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction });
  
  // Set node sizes (dagre needs width/height)
  nodes.forEach(node => {
    g.setNode(node.id, { width: 172, height: 36 });
  });
  
  // Add edges
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  // Compute layout
  dagre.layout(g);
  
  // Apply positions to nodes
  const layoutedNodes = nodes.map(node => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - 86, y: pos.y - 18 }, // Adjust for node center
    };
  });
  
  return { nodes: layoutedNodes, edges };
}
```

**Direction options**:
- `'TB'` — top-to-bottom (vertical, default)
- `'BT'` — bottom-to-top
- `'LR'` — left-to-right (horizontal)
- `'RL'` — right-to-left

---

### `utils/exportImage.js`

**Purpose**: Export React Flow DOM as PNG or SVG using html-to-image.

**Key Functions**:

```javascript
import { toPng, toSvg } from 'html-to-image';
import { saveAs } from 'file-saver';

export async function exportAsPng(element, filename = 'diagram.png') {
  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2, // High DPI
    });
    saveAs(dataUrl, filename);
  } catch (err) {
    console.error('Failed to export PNG:', err);
  }
}

export async function exportAsSvg(element, filename = 'diagram.svg') {
  try {
    const dataUrl = await toSvg(element);
    const svg = dataUrl.split(',')[1];
    const blob = new Blob([atob(svg)], { type: 'image/svg+xml' });
    saveAs(blob, filename);
  } catch (err) {
    console.error('Failed to export SVG:', err);
  }
}
```

---

### `api/generateTree.js`

**Purpose**: API client that POSTs description to backend and returns parsed response.

**Key Function**:
```javascript
export async function generateTree(description) {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  const response = await fetch(`${apiUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate diagram');
  }
  
  return response.json();
}
```

---

## Styling with Tailwind CSS

### Configuration

`tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Global Styles

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* React Flow custom styles */
.react-flow__node {
  @apply rounded border-2;
}

.react-flow__node.decision {
  @apply bg-blue-100 border-blue-500;
}

.react-flow__node.outcome {
  @apply bg-green-100 border-green-500;
}

.react-flow__node.root {
  @apply bg-purple-100 border-purple-500 font-bold;
}
```

---

## Data Flow Diagram

```
User Input
    ↓
InputForm.onSubmit(description)
    ↓
App.handleSubmit()
    ↓
generateTree() API call
    ↓
Backend /api/generate
    ↓
JSON {nodes, edges}
    ↓
App.setNodes(), App.setEdges()
    ↓
DecisionTreeDiagram receives new props
    ↓
getLayoutedElements() (dagre layout)
    ↓
React Flow renders positioned nodes + edges
    ↓
useEffect on diagramReady triggers
    ↓
exportAsPng() (html-to-image)
    ↓
Auto-download PNG file
```

---

## Auto-Download Behavior

1. After API returns, set `diagramReady = true`
2. React renders DecisionTreeDiagram with positioned nodes
3. React Flow completes layout and paint
4. useEffect fires: `setTimeout(() => exportAsPng(...), 500)`
5. 500ms delay allows React Flow to finish rendering
6. PNG file automatically downloads

**Why 500ms?** React Flow needs time to render and position nodes accurately. The delay ensures html-to-image captures a fully-rendered diagram.

---

## Environment Variables

`frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

**Note**: Vite requires env vars to start with `VITE_` prefix to be exposed to client code.

---

## Dependencies

See `frontend/package.json`:
- `react` — UI library
- `react-dom` — React DOM binding
- `reactflow` — Graph visualization
- `dagre` — Auto-layout engine
- `html-to-image` — DOM to PNG/SVG
- `file-saver` — Trigger file downloads
- `tailwindcss` — CSS framework
- `vite` — Dev server & build tool

Dev dependencies:
- `@vitejs/plugin-react` — JSX support
- `autoprefixer` — Tailwind CSS support
- `postcss` — CSS processing

---

## Adding a New Component

To add a new component (e.g., `HistoryPanel.jsx`):

1. Create `src/components/HistoryPanel.jsx`
2. Import and use in `App.jsx`
3. Style with Tailwind classes
4. Pass necessary props from `App.jsx`

---

## Common Issues & Solutions

### Issue: Diagram not rendering
- Ensure backend is returning valid {nodes, edges} JSON
- Check browser console for errors
- Verify React Flow is installed: `npm ls reactflow`

### Issue: Export button not working
- Ensure html-to-image is installed: `npm ls html-to-image`
- Check browser console for errors
- Verify exportImage.js is imported correctly

### Issue: Tailwind styles not applied
- Ensure `tailwind.config.js` has correct `content` paths
- Ensure `src/index.css` imports Tailwind directives
- Restart Vite dev server: `npm run dev`

### Issue: VITE_API_URL not accessible
- Ensure `.env` has `VITE_API_URL=http://localhost:8000`
- Use `import.meta.env.VITE_API_URL` (not `process.env`)
- Restart dev server after editing `.env`

---

## Best Practices

1. **Keep components small** — each component has one responsibility
2. **Use props for data** — pass data down from App.jsx
3. **Use refs carefully** — only for DOM operations (export, measuring)
4. **Error handling** — catch API errors, display user-friendly messages
5. **Loading states** — always show spinner during async operations
6. **Accessibility** — add alt text, labels, ARIA attributes
7. **Performance** — use `useMemo` for expensive calculations (dagre layout)
