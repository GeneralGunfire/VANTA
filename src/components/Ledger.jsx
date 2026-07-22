import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { transactionsToCsv, downloadCsv } from "../lib/csvExport";
import { recordCorrection } from "../lib/correctionHistory";
import CorrectionHistory from "./CorrectionHistory";

const CATEGORIES = ["Sales", "Stock", "Rent", "Utilities", "Transport", "Wages", "Other"];

function truncate(text, len = 60) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len) + "…" : text;
}

// Placeholder: local-state-only edit. Real persistence (Supabase update call)
// is not implemented yet — wire this up to `supabase.from("transactions").update(...)` later.
function EditRow({ transaction, onSave, onCancel }) {
  const [amount, setAmount] = useState(transaction.amount ?? "");
  const [direction, setDirection] = useState(transaction.direction ?? "");
  const [category, setCategory] = useState(transaction.category ?? "");
  const [description, setDescription] = useState(transaction.description ?? "");

  function handleSave() {
    onSave({
      amount: amount === "" ? null : Number(amount),
      direction,
      category,
      description,
    });
  }

  return (
    <tr className="edit-row">
      <td colSpan={9}>
        <div className="txn-edit-form txn-edit-form-row">
          <label>
            Amount
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Direction
            <select value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="">—</option>
              <option value="in">In</option>
              <option value="out">Out</option>
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="card-actions">
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function Ledger({ refreshKey, onNeedsReviewCountChange }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setTransactions(data);
      }
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  useEffect(() => {
    if (!onNeedsReviewCountChange) return;
    onNeedsReviewCountChange(transactions.filter((t) => t.needs_review).length);
  }, [transactions, onNeedsReviewCountChange]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (needsReviewOnly && !t.needs_review) return false;
      if (dateFrom && new Date(t.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(t.created_at) > to) return false;
      }
      return true;
    });
  }, [transactions, categoryFilter, dateFrom, dateTo, needsReviewOnly]);

  function handleExportCsv() {
    const csv = transactionsToCsv(filteredTransactions);
    downloadCsv(csv, `vanta-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // Placeholder: updates local UI state only. Real persistence (Supabase
  // update) needs to be wired in later.
  function handleEditTransaction(id, newValues) {
    console.log("Would update transaction:", id, newValues);
    const before = transactions.find((t) => t.id === id);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...newValues } : t))
    );
    if (before) {
      recordCorrection({
        transactionId: id,
        before: {
          amount: before.amount,
          direction: before.direction,
          category: before.category,
          description: before.description,
        },
        after: newValues,
        source: "ledger",
      });
    }
    setEditingId(null);
  }

  // Placeholder: updates local UI state only. Real persistence (Supabase
  // delete) needs to be wired in later.
  function handleDeleteTransaction(id) {
    console.log("Would delete transaction:", id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  if (loading) return <div className="view"><p>Loading ledger...</p></div>;
  if (errorMsg) return <div className="view"><p className="error-text">Error: {errorMsg}</p></div>;

  if (showCorrections) {
    return <CorrectionHistory onClose={() => setShowCorrections(false)} />;
  }

  return (
    <div className="view">
      <div className="ledger-header">
        <h2>Ledger</h2>
        <div className="ledger-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setShowCorrections(true)}>
            Correction history
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="ledger-filters">
        <label className="ledger-filter">
          Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="ledger-filter">
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="ledger-filter">
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <label className="ledger-filter ledger-filter-toggle">
          <input
            type="checkbox"
            checked={needsReviewOnly}
            onChange={(e) => setNeedsReviewOnly(e.target.checked)}
          />
          Needs review only
        </label>
      </div>

      <div className="table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Raw input</th>
              <th>Amount</th>
              <th>Direction</th>
              <th>Category</th>
              <th>Description</th>
              <th>Confidence</th>
              <th>Source</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) =>
              editingId === t.id ? (
                <EditRow
                  key={t.id}
                  transaction={t}
                  onSave={(newValues) => handleEditTransaction(t.id, newValues)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <tr key={t.id} className={t.needs_review ? "needs-review-row" : ""}>
                  <td className="raw-input-cell">
                    {t.needs_review && <span className="badge">Needs review</span>}
                    {expandedId === t.id ? t.raw_input : truncate(t.raw_input)}
                    {t.raw_input && t.raw_input.length > 60 && (
                      <button
                        className="expand-btn"
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      >
                        {expandedId === t.id ? "less" : "more"}
                      </button>
                    )}
                  </td>
                  <td className="mono">{t.amount != null ? `R${Number(t.amount).toFixed(2)}` : "—"}</td>
                  <td>{t.direction ?? "—"}</td>
                  <td>{t.category ?? "—"}</td>
                  <td>{t.description ?? "—"}</td>
                  <td className="mono">{t.confidence != null ? t.confidence.toFixed(2) : "—"}</td>
                  <td>{t.source}</td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td className="ledger-actions-cell">
                    {deletingId === t.id ? (
                      <span className="ledger-confirm-delete">
                        Delete?
                        <button
                          type="button"
                          className="expand-btn"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="expand-btn"
                          onClick={() => setDeletingId(null)}
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Edit transaction"
                          title="Edit"
                          onClick={() => setEditingId(t.id)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Delete transaction"
                          title="Delete"
                          onClick={() => setDeletingId(t.id)}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && <p>No transactions match these filters.</p>}
      </div>
    </div>
  );
}
