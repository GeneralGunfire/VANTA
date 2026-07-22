import { useEffect, useState } from "react";
import Chat from "./components/Chat";
import Ledger from "./components/Ledger";
import BusinessProfile from "./components/BusinessProfile";
import HelpPanel from "./components/HelpPanel";
import Onboarding, { ONBOARDING_STEPS } from "./components/Onboarding";
import SignedOutEntry from "./components/SignedOutEntry";
import Loader from "./components/Loader";
import { supabase } from "./supabaseClient";
import "./App.css";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "ledger", label: "Ledger" },
];

// Placeholder only: selecting a language updates this state but does not
// translate any content yet. Real i18n (string catalogs, locale switching)
// is a future task — all copy stays in English regardless of selection.
const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "zu", label: "isiZulu" },
  { id: "af", label: "Afrikaans" },
];

// SMS provider setup is unresolved on the Supabase dashboard side; auth is
// parked (not removed) so pipeline/frontend testing can continue unblocked.
// Flip back to true once the provider config is sorted out.
const AUTH_ENABLED = false;

function App() {
  const [tab, setTab] = useState("chat");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  // Placeholder only — see LANGUAGES comment above. Not applied to any copy.
  const [language, setLanguage] = useState("en");
  // loading | signed-out-entry | needs-onboarding | ready
  const [authState, setAuthState] = useState(AUTH_ENABLED ? "loading" : "ready");
  const [onboardingStep, setOnboardingStep] = useState(ONBOARDING_STEPS.PHONE);
  const [skipProfile, setSkipProfile] = useState(false);

  useEffect(() => {
    if (AUTH_ENABLED) checkSession();
  }, []);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setAuthState("signed-out-entry");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile) {
      setAuthState("ready");
    } else {
      setAuthState("needs-onboarding");
      setOnboardingStep(ONBOARDING_STEPS.BUSINESS_NAME);
      setSkipProfile(false);
    }
  }

  function handleChooseSignIn() {
    setOnboardingStep(ONBOARDING_STEPS.PHONE);
    setSkipProfile(true);
    setAuthState("needs-onboarding");
  }

  function handleChooseCreate() {
    setOnboardingStep(ONBOARDING_STEPS.PHONE);
    setSkipProfile(false);
    setAuthState("needs-onboarding");
  }

  function handleTabChange(id) {
    if (id === "ledger") setRefreshKey((k) => k + 1);
    setTab(id);
  }

  function openPanel(panel) {
    setShowProfile(panel === "profile");
    setShowHelp(panel === "help");
  }

  if (authState === "loading") {
    return (
      <div className="app app-hero">
        <Loader />
      </div>
    );
  }

  if (authState === "signed-out-entry") {
    return (
      <div className="app app-hero">
        <SignedOutEntry onChooseSignIn={handleChooseSignIn} onChooseCreate={handleChooseCreate} />
      </div>
    );
  }

  if (authState === "needs-onboarding") {
    return (
      <div className="app app-hero">
        <Onboarding
          startStep={onboardingStep}
          skipProfile={skipProfile}
          onComplete={() => setAuthState("ready")}
        />
      </div>
    );
  }

  return (
    <div className="app app-hero">
      <header className="app-header">
        <h1 className="app-title">Vanta</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id && !showProfile && !showHelp ? "tab active" : "tab"}
              onClick={() => {
                openPanel(null);
                handleTabChange(t.id);
              }}
            >
              {t.label}
              {t.id === "ledger" && needsReviewCount > 0 && (
                <span className="nav-badge" aria-label={`${needsReviewCount} need review`}>
                  {needsReviewCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="app-header-tools">
          <select
            className="language-select"
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="profile-nav-btn"
            aria-label="Help"
            title="Help"
            onClick={() => openPanel("help")}
          >
            ?
          </button>
          <button
            type="button"
            className="profile-nav-btn"
            aria-label="Business profile"
            title="Business profile"
            onClick={() => openPanel("profile")}
          >
            ⚙
          </button>
        </div>
      </header>

      <main className={tab === "chat" && !showProfile && !showHelp ? "main-chat" : "main-ledger"}>
        <div key={showProfile ? "profile" : showHelp ? "help" : tab} className="view-transition">
          {showProfile && <BusinessProfile onClose={() => openPanel(null)} />}
          {showHelp && <HelpPanel onClose={() => openPanel(null)} />}
          {!showProfile && !showHelp && tab === "chat" && <Chat />}
          {!showProfile && !showHelp && tab === "ledger" && (
            <Ledger refreshKey={refreshKey} onNeedsReviewCountChange={setNeedsReviewCount} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
