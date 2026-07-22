import * as XLSX from "xlsx";

export function rowToRawInput(headers, row) {
  return headers
    .map((h, i) => {
      const val = row[i];
      if (val === undefined || val === null || val === "") return null;
      return `${h}: ${val}`;
    })
    .filter(Boolean)
    .join(", ");
}

export async function fileToRows(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (data.length === 0) return [];
  const headers = data[0].map((h) => String(h).trim() || "Field");
  const rows = data.slice(1).filter((r) => r.some((cell) => cell !== ""));

  return rows.map((row) => rowToRawInput(headers, row));
}
