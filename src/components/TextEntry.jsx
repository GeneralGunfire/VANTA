import { useState } from "react";
import { parseTransaction } from "../supabaseClient";

export default function TextEntry() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("loading");
    setResult(null);
    try {
      const row = await parseTransaction(text, "text");
      setResult(row);
      setStatus("success");
      setText("");
      setTimeout(() => {
        setStatus("idle");
        setResult(null);
      }, 4000);
    } catch (err) {
      setErrorMsg(err.message ?? String(err));
      setStatus("error");
    }
  }

  return (
    <div className="view">
      <h2>Add a transaction</h2>
      <form onSubmit={handleSubmit} className="text-entry-form">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Sold 3 bags of maize meal for R450 cash"
          rows={4}
          disabled={status === "loading"}
        />
        <button type="submit" disabled={status === "loading" || !text.trim()}>
          {status === "loading" ? "Parsing..." : "Submit"}
        </button>
      </form>

      {status === "error" && <p className="error-text">Error: {errorMsg}</p>}

      {status === "success" && result && (
        <div className="parse-result">
          <p className="parse-result-title">Parsed:</p>
          <ul>
            <li>Amount: {result.amount ?? "—"}</li>
            <li>Direction: {result.direction ?? "—"}</li>
            <li>Category: {result.category ?? "—"}</li>
            <li>Description: {result.description ?? "—"}</li>
            <li>Confidence: {result.confidence != null ? result.confidence.toFixed(2) : "—"}</li>
            {result.needs_review && <li className="needs-review-tag">Needs review</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
