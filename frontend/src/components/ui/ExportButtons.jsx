import { useState } from 'react';
import { toPng } from 'html-to-image';
import { exportAsPng, exportAsSvg } from '../../utils/exportImage';
import { exportAsDocx } from '../../utils/exportDocx';

export default function ExportButtons({ flowRef, description, treeData, finalizedImage, onFinalize, diagramType = 'decision_tree' }) {
  const [finalizing, setFinalizing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Phase 1: Capture the current diagram as a high-res PNG data-URL
  // Hides controls, minimap, panels, and background grid before capture
  const handleFinalize = async () => {
    try {
      setFinalizing(true);
      const element = flowRef.current;
      if (!element) throw new Error('Diagram element not found');

      // Selectors for UI chrome that should NOT appear in the final image
      const hideSelectors = [
        '.react-flow__controls',
        '.react-flow__minimap',
        '.react-flow__panel',
        '.react-flow__background',
      ];

      // Temporarily hide UI chrome
      const hidden = [];
      hideSelectors.forEach(sel => {
        element.querySelectorAll(sel).forEach(el => {
          hidden.push({ el, prev: el.style.display });
          el.style.display = 'none';
        });
      });

      // Set a white background so the grid doesn't bleed through
      const viewport = element.querySelector('.react-flow__renderer') || element;
      const prevBg = viewport.style.background;
      viewport.style.background = '#ffffff';

      try {
        const dataUrl = await toPng(element, {
          cacheBust: true,
          pixelRatio: 2,
          width: element.offsetWidth,
          height: element.offsetHeight,
          backgroundColor: '#ffffff',
        });
        onFinalize(dataUrl);
      } finally {
        // Restore everything
        hidden.forEach(({ el, prev }) => { el.style.display = prev; });
        viewport.style.background = prevBg;
      }
    } catch (err) {
      console.error('Failed to finalize image:', err);
      alert('Failed to finalize image. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  // Re-edit: clear the finalized image so user can make more changes
  const handleReEdit = () => {
    onFinalize(null);
  };

  // Phase 2: Embed finalized image into a .docx and download
  const handleDownloadDocx = async () => {
    try {
      setExporting(true);
      const filename = `${diagramType.replace(/_/g, '-')}-diagram.docx`;
      await exportAsDocx(description, treeData, finalizedImage, filename, diagramType);
    } catch (err) {
      console.error('Failed to export Word document:', err);
      alert('Failed to export Word document. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      await exportAsPng(flowRef.current, `${diagramType.replace(/_/g, '-')}-diagram.png`);
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Failed to export PNG. Please try again.');
    }
  };

  const handleDownloadSvg = async () => {
    try {
      await exportAsSvg(flowRef.current, `${diagramType.replace(/_/g, '-')}-diagram.svg`);
    } catch (err) {
      console.error('Failed to export SVG:', err);
      alert('Failed to export SVG. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Phase 1: Finalize / Re-edit */}
      {!finalizedImage ? (
        <button
          onClick={handleFinalize}
          disabled={finalizing}
          className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {finalizing ? 'Capturing…' : 'Finalize Image'}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Preview of finalized image */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Image finalized! You can now download as Word or go back to edit.
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden max-w-xl">
            <img src={finalizedImage} alt="Finalized decision tree" className="max-h-64 w-auto" />
          </div>

          {/* Phase 2: Download & Re-edit buttons */}
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={handleDownloadDocx}
              disabled={exporting}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? 'Generating…' : 'Download as Word (.docx)'}
            </button>

            <button
              onClick={handleReEdit}
              className="px-6 py-2.5 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Re-edit Diagram
            </button>
          </div>
        </div>
      )}

      {/* Always available: raw PNG / SVG downloads */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadPng}
          className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          PNG
        </button>
        <button
          onClick={handleDownloadSvg}
          className="px-5 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          SVG
        </button>
      </div>
    </div>
  );
}
