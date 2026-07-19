import { useState } from "react";
import TextEntry from "./components/TextEntry";
import ExcelUpload from "./components/ExcelUpload";
import Ledger from "./components/Ledger";
import "./App.css";

const TABS = [
  { id: "text", label: "Add Transaction" },
  { id: "upload", label: "Upload Excel/CSV" },
  { id: "ledger", label: "Ledger" },
];

function App() {
  const [tab, setTab] = useState("text");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleTabChange(id) {
    if (id === "ledger") setRefreshKey((k) => k + 1);
    setTab(id);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Vanta</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "tab active" : "tab"}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "text" && <TextEntry />}
        {tab === "upload" && <ExcelUpload />}
        {tab === "ledger" && <Ledger refreshKey={refreshKey} />}
      </main>
    </div>
  );
}

export default App;
