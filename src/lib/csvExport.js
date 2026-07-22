// Client-side CSV generation from already-loaded transaction rows.
const COLUMNS = [
  { key: "raw_input", label: "Raw input" },
  { key: "amount", label: "Amount" },
  { key: "direction", label: "Direction" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "confidence", label: "Confidence" },
  { key: "source", label: "Source" },
  { key: "created_at", label: "Created" },
];

function escapeCsvValue(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function transactionsToCsv(transactions) {
  const header = COLUMNS.map((c) => escapeCsvValue(c.label)).join(",");
  const rows = transactions.map((t) =>
    COLUMNS.map((c) => escapeCsvValue(t[c.key])).join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadCsv(csvContent, filename = "ledger.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
