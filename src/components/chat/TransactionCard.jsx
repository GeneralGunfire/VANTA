import { useState } from "react";

const CATEGORIES = ["Sales", "Stock", "Rent", "Utilities", "Transport", "Wages", "Other"];
const CONFIDENCE_THRESHOLD = 0.7;

// onConfirmTransaction / onEditTransaction are placeholders: they currently
// only update local chat UI state and log to console. Real persistence
// (e.g. re-saving edits back to the transactions table) gets wired in later.
export default function TransactionCard({ transaction, onConfirmTransaction, onEditTransaction }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(transaction);
  const [confirmed, setConfirmed] = useState(false);

  const isLowConfidence = transaction.confidence < CONFIDENCE_THRESHOLD;

  function handleConfirm() {
    setConfirmed(true);
    onConfirmTransaction?.(draft);
  }

  function handleSaveEdit() {
    setEditing(false);
    onEditTransaction?.(transaction, draft);
  }

  const cardClass = isLowConfidence
    ? "chat-card chat-card-flag"
    : "chat-card";

  return (
    <div className="chat-row chat-row-bot">
      <div className={cardClass}>
        {isLowConfidence && (
          <div className="card-badge card-badge-flag">Needs review</div>
        )}

        {!editing ? (
          <>
            <div className="txn-amount mono">
              {draft.direction === "out" ? "-" : "+"}R{Number(draft.amount ?? 0).toFixed(2)}
            </div>
            <dl className="txn-details">
              <div>
                <dt>Direction</dt>
                <dd>{draft.direction === "in" ? "Money in" : "Money out"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{draft.category}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{draft.description}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd className="mono">{Number(draft.confidence ?? 0).toFixed(2)}</dd>
              </div>
            </dl>

            {!confirmed ? (
              <div className="card-actions">
                <button className="btn btn-primary" onClick={handleConfirm}>
                  Confirm
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                  Edit
                </button>
              </div>
            ) : (
              <p className="card-confirmed-note">Confirmed</p>
            )}
          </>
        ) : (
          <div className="txn-edit-form">
            <label>
              Amount
              <input
                type="number"
                className="mono"
                value={draft.amount ?? ""}
                onChange={(e) => setDraft({ ...draft, amount: parseFloat(e.target.value) })}
              />
            </label>
            <label>
              Direction
              <select
                value={draft.direction ?? "in"}
                onChange={(e) => setDraft({ ...draft, direction: e.target.value })}
              >
                <option value="in">Money in</option>
                <option value="out">Money out</option>
              </select>
            </label>
            <label>
              Category
              <select
                value={draft.category ?? "Other"}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
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
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <div className="card-actions">
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Save
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
