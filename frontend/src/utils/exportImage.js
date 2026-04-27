import { toPng, toSvg } from 'html-to-image';
import { saveAs } from 'file-saver';

/**
 * Hide UI chrome (controls, minimap, panels, grid, toolbars) before capture,
 * then restore after.
 */
function hideChrome(element) {
  const selectors = [
    '.react-flow__controls',
    '.react-flow__minimap',
    '.react-flow__panel',
    '.react-flow__background',
    '.react-flow__node-toolbar',
  ];
  const hidden = [];
  selectors.forEach(sel => {
    element.querySelectorAll(sel).forEach(el => {
      hidden.push({ el, prev: el.style.display });
      el.style.display = 'none';
    });
  });
  // White background so no grid bleeds through
  const viewport = element.querySelector('.react-flow__renderer') || element;
  const prevBg = viewport.style.background;
  viewport.style.background = '#ffffff';
  return { hidden, viewport, prevBg };
}

function restoreChrome({ hidden, viewport, prevBg }) {
  hidden.forEach(({ el, prev }) => { el.style.display = prev; });
  viewport.style.background = prevBg;
}

/**
 * Get the bounding box of only the nodes viewport (cropped).
 */
function getNodesBounds(element) {
  const nodesContainer = element.querySelector('.react-flow__nodes');
  if (!nodesContainer) return null;
  const nodeEls = nodesContainer.querySelectorAll('.react-flow__node');
  if (nodeEls.length === 0) return null;

  const viewportEl = element.querySelector('.react-flow__viewport');
  const viewportRect = viewportEl ? viewportEl.getBoundingClientRect() : element.getBoundingClientRect();

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodeEls.forEach(n => {
    const r = n.getBoundingClientRect();
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.right);
    maxY = Math.max(maxY, r.bottom);
  });

  const containerRect = element.getBoundingClientRect();
  const padding = 40; // px padding around cropped diagram
  return {
    x: Math.max(0, minX - containerRect.left - padding),
    y: Math.max(0, minY - containerRect.top - padding),
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2,
  };
}

/**
 * Crop a full-size data URL to the given bounds and return a new data URL.
 */
function cropDataUrl(dataUrl, bounds, pixelRatio) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = bounds.width * pixelRatio;
      const h = bounds.height * pixelRatio;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(
        img,
        bounds.x * pixelRatio, bounds.y * pixelRatio, w, h,
        0, 0, w, h,
      );
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

/**
 * Export React Flow diagram as PNG (clean, cropped).
 */
export async function exportAsPng(element, filename = 'diagram.png') {
  try {
    if (!element) throw new Error('Element not found for export');

    const chrome = hideChrome(element);
    const pixelRatio = 2;

    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio,
        width: element.offsetWidth,
        height: element.offsetHeight,
        backgroundColor: '#ffffff',
      });

      const bounds = getNodesBounds(element);
      if (bounds) {
        const cropped = await cropDataUrl(dataUrl, bounds, pixelRatio);
        saveAs(cropped, filename);
      } else {
        saveAs(dataUrl, filename);
      }
    } finally {
      restoreChrome(chrome);
    }
  } catch (err) {
    console.error('Failed to export PNG:', err);
    throw new Error('Failed to export PNG. Please try again.');
  }
}

/**
 * Export React Flow diagram as SVG (clean, no chrome).
 */
export async function exportAsSvg(element, filename = 'diagram.svg') {
  try {
    if (!element) throw new Error('Element not found for export');

    const chrome = hideChrome(element);

    try {
      const dataUrl = await toSvg(element, {
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, filename);
    } finally {
      restoreChrome(chrome);
    }
  } catch (err) {
    console.error('Failed to export SVG:', err);
    throw new Error('Failed to export SVG. Please try again.');
  }
}
