export default function SignedOutEntry({ onChooseSignIn, onChooseCreate }) {
  return (
    <div className="chat-view chat-view-empty">
      <div className="hero-state onboarding-state">
        <h1 className="hero-headline">
          <span className="hero-dim">Welcome to </span>
          Vanta
        </h1>
        <div className="entry-choice">
          <button type="button" className="btn btn-primary" onClick={onChooseSignIn}>
            Sign in
          </button>
          <button type="button" className="btn btn-secondary" onClick={onChooseCreate}>
            Create a business
          </button>
        </div>
      </div>
    </div>
  );
}
