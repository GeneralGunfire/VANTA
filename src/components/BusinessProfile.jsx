import { useState } from "react";

// Placeholder screen: local-state-only, not wired to the `profiles` table.
// Auth (and the profiles table it depends on) is currently disabled — see
// AUTH_ENABLED in App.jsx. Once auth is re-enabled, load/save these fields
// against `supabase.from("profiles")` instead of local state.
export default function BusinessProfile({ onClose }) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    console.log("Would save business profile (stub):", { businessName, businessType });
    setSaved(true);
  }

  return (
    <div className="view">
      <div className="ledger-header">
        <h2>Business profile</h2>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <form className="profile-form" onSubmit={handleSave}>
        <label>
          Business name
          <input
            type="text"
            placeholder="e.g. Thandi's Spaza Shop"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <label>
          Business type
          <input
            type="text"
            placeholder="e.g. Spaza shop, salon, taxi"
            value={businessType}
            onChange={(e) => {
              setBusinessType(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {saved && <p className="profile-saved-note">Saved locally (not yet persisted).</p>}
      </form>
    </div>
  );
}
