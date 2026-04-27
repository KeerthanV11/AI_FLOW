import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const DIAGRAM_TYPE_TITLES = {
  decision_tree: 'Decision Tree Report',
  system_architecture: 'System Architecture Report',
  data_flow: 'Data Flow Report',
  process_flow: 'Process Flow Report',
};

/**
 * Generate and download a .docx file containing:
 *   1. Title
 *   2. Description text
 *   3. Generated tree JSON code
 *   4. Finalized diagram image
 *
 * @param {string}   description  - The original description text.
 * @param {object}   treeData     - The raw { nodes, edges } JSON from the backend.
 * @param {string}   imageBase64  - Base64 data-URL of the finalized diagram PNG.
 * @param {string}   filename     - Output filename.
 * @param {string}   diagramType  - Type of diagram for the report title.
 */
export async function exportAsDocx(description, treeData, imageBase64, filename = 'diagram.docx', diagramType = 'decision_tree') {
  // Strip the data-url prefix to get raw base64
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Build a temporary image to read actual pixel dimensions
  const imgDimensions = await getImageDimensions(imageBase64);

  // Scale image to fit page width (max ~6 inches = 572 pts ≈ 600px at 96dpi)
  const MAX_WIDTH = 600;
  let imgWidth = imgDimensions.width;
  let imgHeight = imgDimensions.height;
  if (imgWidth > MAX_WIDTH) {
    const ratio = MAX_WIDTH / imgWidth;
    imgWidth = MAX_WIDTH;
    imgHeight = Math.round(imgHeight * ratio);
  }

  // Format the tree JSON as pretty-printed code
  const codeString = JSON.stringify(treeData, null, 2);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ── Title ──
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: DIAGRAM_TYPE_TITLES[diagramType] || 'Diagram Report',
                bold: true,
                size: 36,
                font: 'Calibri',
              }),
            ],
          }),

          // Separator
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '4f46e5' },
            },
            spacing: { after: 300 },
          }),

          // ── Description Section ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'Description',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: description,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),

          // ── Generated Code Section ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'Generated Structure (JSON)',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          // Render each line of the JSON in a monospaced font
          ...codeString.split('\n').map(line =>
            new Paragraph({
              spacing: { after: 0, line: 276 },
              children: [
                new TextRun({
                  text: line,
                  size: 18,
                  font: 'Consolas',
                  color: '1e293b',
                }),
              ],
            })
          ),

          // Spacer after code block
          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // ── Diagram Section ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: (DIAGRAM_TYPE_TITLES[diagramType] || 'Diagram').replace(' Report', ' Diagram'),
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: { width: imgWidth, height: imgHeight },
                type: 'png',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}
