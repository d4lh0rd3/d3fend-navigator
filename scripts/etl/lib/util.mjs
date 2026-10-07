import { readFile } from "node:fs/promises";

/** Extrait le nom local d'une URI ou d'un @id JSON-LD (ex. "d3f:Harden" -> "Harden",
 *  "http://d3fend.mitre.org/ontologies/d3fend.owl#T1003.005" -> "T1003.005"). */
export function localName(idOrUri) {
  if (!idOrUri) return null;
  const s = typeof idOrUri === "object" ? idOrUri["@id"] ?? idOrUri.value : idOrUri;
  if (!s) return null;
  const hashIdx = s.lastIndexOf("#");
  if (hashIdx >= 0) return s.slice(hashIdx + 1);
  const colonIdx = s.indexOf(":");
  return colonIdx >= 0 ? s.slice(colonIdx + 1) : s;
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

/** Parseur CSV minimal (champs entre guillemets, virgules et guillemets échappés `""`). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift();
  return rows.filter((r) => r.length > 1 || r[0] !== "").map((r) => {
    const obj = {};
    header.forEach((h, idx) => (obj[h] = r[idx] ?? ""));
    return obj;
  });
}
