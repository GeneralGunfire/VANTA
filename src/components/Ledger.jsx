import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function truncate(text, len = 60) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len) + "…" : text;
}

export default function Ledger({ refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedId, setExpandedId] = useState(null);

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

  if (loading) return <div className="view"><p>Loading ledger...</p></div>;
  if (errorMsg) return <div className="view"><p className="error-text">Error: {errorMsg}</p></div>;

  return (
    <div className="view">
      <h2>Ledger</h2>
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
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
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
                <td>{t.amount ?? "—"}</td>
                <td>{t.direction ?? "—"}</td>
                <td>{t.category ?? "—"}</td>
                <td>{t.description ?? "—"}</td>
                <td>{t.confidence != null ? t.confidence.toFixed(2) : "—"}</td>
                <td>{t.source}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p>No transactions yet.</p>}
      </div>
    </div>
  );
}
