import { Tactic } from "../classes/tactic.model";
import { D3fendLayer } from "../classes/layer.model";
import { TechniqueNode } from "../matrix/technique-node.model";

const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 26;
const COLUMN_WIDTH = 220;
const COLUMN_GAP = 8;
const INDENT = 12;
const TITLE_HEIGHT = 22;
const PADDING = 10;
const FONT_SIZE = 9.5;
const AVG_CHAR_WIDTH = 5.3; // approximation pour une police sans-serif à 9.5px

interface Row {
  node: TechniqueNode;
  depth: number;
}

/** Utilise l'état d'expansion du layer, pas celui induit par la recherche en cours,
 *  pour que l'export soit reproductible. */
function flattenVisible(nodes: TechniqueNode[], depth: number, expandedIds: Set<string>, out: Row[]): void {
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children.length && expandedIds.has(node.id)) {
      flattenVisible(node.children, depth + 1, expandedIds, out);
    }
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(label: string, availableWidth: number): string {
  const maxChars = Math.max(4, Math.floor(availableWidth / AVG_CHAR_WIDTH));
  if (label.length <= maxChars) return label;
  return label.slice(0, maxChars - 1) + "…";
}

/** SVG vectoriel de la matrice, dans l'état d'expansion et les couleurs du layer. */
export function buildMatrixSvg(
  tactics: Tactic[],
  treeByTactic: Map<string, TechniqueNode[]>,
  layer: D3fendLayer
): string {
  const expandedIds = new Set(layer.expandedNodeIds);
  const colorByTechniqueId = new Map(layer.techniques.filter((t) => t.color).map((t) => [t.techniqueID, t.color]));

  const columns = tactics.map((tactic) => {
    const rows: Row[] = [];
    flattenVisible(treeByTactic.get(tactic.id) ?? [], 0, expandedIds, rows);
    return { tactic, rows };
  });

  const maxRows = Math.max(0, ...columns.map((c) => c.rows.length));
  const width = PADDING * 2 + columns.length * COLUMN_WIDTH + Math.max(0, columns.length - 1) * COLUMN_GAP;
  const headerY = PADDING + TITLE_HEIGHT;
  const height = headerY + HEADER_HEIGHT + maxRows * ROW_HEIGHT + PADDING;

  let body = "";

  columns.forEach((col, colIndex) => {
    const x = PADDING + colIndex * (COLUMN_WIDTH + COLUMN_GAP);

    body += `<rect x="${x}" y="${headerY}" width="${COLUMN_WIDTH}" height="${HEADER_HEIGHT}" fill="#1f2937" />\n`;
    body += `<text x="${x + COLUMN_WIDTH / 2}" y="${headerY + HEADER_HEIGHT / 2 + 4}" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#ffffff">${escapeXml(col.tactic.name)}</text>\n`;

    col.rows.forEach((row, rowIndex) => {
      const y = headerY + HEADER_HEIGHT + rowIndex * ROW_HEIGHT;
      const fill = colorByTechniqueId.get(row.node.id) || (rowIndex % 2 === 0 ? "#ffffff" : "#f7f7f8");
      body += `<rect x="${x}" y="${y}" width="${COLUMN_WIDTH}" height="${ROW_HEIGHT}" fill="${fill}" stroke="#e2e2e2" stroke-width="0.5" />\n`;

      const textX = x + 4 + row.depth * INDENT;
      const availableWidth = COLUMN_WIDTH - 8 - row.depth * INDENT;
      const label = truncate(`${row.node.id}  ${row.node.name}`, availableWidth);
      body += `<text x="${textX}" y="${y + ROW_HEIGHT / 2 + 3.5}" font-family="sans-serif" font-size="${FONT_SIZE}" fill="#111827"><title>${escapeXml(row.node.id + " — " + row.node.name)}</title>${escapeXml(label)}</text>\n`;
    });
  });

  const title = layer.name ? `d3fend-navigator — ${escapeXml(layer.name)}` : "d3fend-navigator";

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n` +
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />\n` +
    `<text x="${PADDING}" y="${PADDING + 14}" font-family="sans-serif" font-size="14" font-weight="700" fill="#111827">${title}</text>\n` +
    body +
    `</svg>\n`
  );
}
