import { useEffect, useState } from "react";
import { getCorrectionHistory, subscribeCorrectionHistory } from "../lib/correctionHistory";

const FIELD_LABELS = {
  amount: "Amount",
  direction: "Direction",
  category: "Category",
  description: "Description",
};

function formatValue(field, value) {
  if (value == null || value === "") return "—";
  if (field === "amount") return `R${Number(value).toFixed(2)}`;
  return String(value);
}

// Preview of a future "corrections feed back into categorisation" feature.
// Reads from the in-memory correctionHistory store populated by the
// placeholder onEditTransaction handlers — no real feedback loop yet.
export default function CorrectionHistory({ onClose }) {
  const [entries, setEntries] = useState(getCorrectionHistory());

  useEffect(() => {
    return subscribeCorrectionHistory(setEntries);
  }, []);

  return (
    <div className="view">
      <div className="ledger-header">
        <h2>Correction history</h2>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Back to ledger
        </button>
      </div>

      {entries.length === 0 && <p>No corrections have been made yet.</p>}

      <div className="correction-list">
        {entries.map((entry) => {
          const changedFields = Object.keys(FIELD_LABELS).filter(
            (field) => entry.after[field] !== undefined && entry.after[field] !== entry.before[field]
          );
          return (
            <div key={entry.id} className="correction-card">
              <div className="correction-card-meta">
                <span>{new Date(entry.correctedAt).toLocaleString()}</span>
                <span className="correction-source">via {entry.source}</span>
              </div>
              {changedFields.length === 0 && <p className="correction-empty">No fields changed.</p>}
              {changedFields.map((field) => (
                <div key={field} className="correction-row">
                  <span className="correction-field">{FIELD_LABELS[field]}</span>
                  <span className="correction-before">{formatValue(field, entry.before[field])}</span>
                  <span className="correction-arrow">→</span>
                  <span className="correction-after">{formatValue(field, entry.after[field])}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
