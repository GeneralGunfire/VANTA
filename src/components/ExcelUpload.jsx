import { useState } from "react";
import * as XLSX from "xlsx";
import { parseTransaction } from "../supabaseClient";

function rowToRawInput(headers, row) {
  return headers
    .map((h, i) => {
      const val = row[i];
      if (val === undefined || val === null || val === "") return null;
      return `${h}: ${val}`;
    })
    .filter(Boolean)
    .join(", ");
}

async function fileToRows(file) {
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

export default function ExcelUpload() {
  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("processing");
    setErrorMsg("");
    setProgress({ done: 0, total: 0 });

    try {
      const rawInputs = await fileToRows(file);
      setProgress({ done: 0, total: rawInputs.length });

      for (let i = 0; i < rawInputs.length; i++) {
        try {
          await parseTransaction(rawInputs[i], "excel");
        } catch (rowErr) {
          console.error("Row failed:", rawInputs[i], rowErr);
        }
        setProgress({ done: i + 1, total: rawInputs.length });
      }

      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message ?? String(err));
      setStatus("error");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="view">
      <h2>Upload Excel / CSV</h2>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        disabled={status === "processing"}
      />

      {status === "processing" && (
        <p className="upload-progress">
          Processing {progress.done} / {progress.total} rows...
        </p>
      )}
      {status === "done" && (
        <p className="upload-progress">
          Done — {progress.done} / {progress.total} rows processed.
        </p>
      )}
      {status === "error" && <p className="error-text">Error: {errorMsg}</p>}
    </div>
  );
}
