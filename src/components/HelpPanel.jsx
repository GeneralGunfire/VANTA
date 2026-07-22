const FAQ_ITEMS = [
  {
    q: "How do I add a transaction?",
    a: "Just type what happened, like 'sold bread for R50' or 'paid R200 for airtime'. Vanta will add it to your list.",
  },
  {
    q: "What does 'needs review' mean?",
    a: "It means Vanta wasn't fully sure it understood that one correctly. Take a look and fix it if something's wrong.",
  },
  {
    q: "How do I see my ledger?",
    a: "Tap 'Ledger' at the top. That's the full list of everything you've added.",
  },
  {
    q: "Can I fix a mistake?",
    a: "Yes. Find the entry in your ledger and tap the edit icon to change it, or tap the delete icon to remove it.",
  },
  {
    q: "Can I upload a file instead of typing?",
    a: "Yes. Tap the paperclip icon next to the message box and choose an Excel or CSV file.",
  },
  {
    q: "How do I download my records?",
    a: "In the Ledger, tap 'Export CSV' to save a copy you can open in Excel or share.",
  },
];

// Static content only, no backend wiring needed for this pass.
export default function HelpPanel({ onClose }) {
  return (
    <div className="view">
      <div className="ledger-header">
        <h2>Help</h2>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="faq-list">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="faq-item">
            <p className="faq-question">{item.q}</p>
            <p className="faq-answer">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
