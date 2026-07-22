import { useState } from "react";
import MessageList from "./chat/MessageList";
import MessageInput from "./chat/MessageInput";
import ParticleSphere from "./ParticleSphere";
import { parseTransaction } from "../supabaseClient";
import { fileToRows } from "../lib/excelParsing";
import {
  routeMessage,
  INTENTS,
  handleSummaryRequest,
  handleDataQuery,
} from "../lib/routeMessage";
import { recordCorrection } from "../lib/correctionHistory";

let nextId = 1;
function makeId() {
  return `msg-${nextId++}`;
}

export default function Chat() {
  const [messages, setMessages] = useState([]);

  function addMessage(msg) {
    const id = makeId();
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  }

  function updateMessage(id, patch) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function handleSendText(text) {
    addMessage({ type: "user", text });

    const { intent } = routeMessage(text);

    if (intent === INTENTS.SUMMARY_REQUEST) {
      addMessage({ type: "bot-text", text: handleSummaryRequest() });
      return;
    }
    if (intent === INTENTS.DATA_QUERY) {
      addMessage({ type: "bot-text", text: handleDataQuery() });
      return;
    }

    // NEW_TRANSACTION (default) — real parser, existing pipeline.
    const loadingId = addMessage({ type: "bot-loading" });
    try {
      const row = await parseTransaction(text, "text");
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      addMessage({ type: "bot-transaction", transaction: row });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      addMessage({
        type: "bot-error",
        text: `Something went wrong parsing that: ${err.message ?? String(err)}`,
      });
    }
  }

  async function handleSendFile(file) {
    addMessage({ type: "user", text: `Uploaded ${file.name}` });

    const uploadId = addMessage({
      type: "bot-upload",
      fileName: file.name,
      status: "processing",
      progress: { done: 0, total: 0, failed: 0 },
    });

    try {
      const rawInputs = await fileToRows(file);
      updateMessage(uploadId, { progress: { done: 0, total: rawInputs.length, failed: 0 } });

      let failed = 0;
      for (let i = 0; i < rawInputs.length; i++) {
        try {
          await parseTransaction(rawInputs[i], "excel");
        } catch (rowErr) {
          failed += 1;
          console.error("Row failed:", rawInputs[i], rowErr);
        }
        updateMessage(uploadId, {
          progress: { done: i + 1, total: rawInputs.length, failed },
        });
      }

      updateMessage(uploadId, { status: "done" });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== uploadId));
      addMessage({
        type: "bot-error",
        text: `Couldn't process that file: ${err.message ?? String(err)}`,
      });
    }
  }

  // Placeholder: currently only updates local chat UI state and logs to
  // console. Real persistence (e.g. re-saving edits back to the
  // transactions table) is not implemented yet.
  function handleConfirmTransaction(messageId, transaction) {
    console.log("onConfirmTransaction (stub):", transaction);
  }

  // Placeholder: currently only updates local chat UI state and logs to
  // console. Real persistence gets wired in later.
  function handleEditTransaction(messageId, before, after) {
    console.log("onEditTransaction (stub):", after);
    recordCorrection({
      transactionId: before?.id ?? messageId,
      before: {
        amount: before?.amount,
        direction: before?.direction,
        category: before?.category,
        description: before?.description,
      },
      after,
      source: "chat",
    });
  }

  const isEmpty = messages.length === 0;

  // Quick-action shortcuts that just send the equivalent plain-text request
  // into the same chat pipeline — no new summary logic, routes through the
  // existing (placeholder) intent handling in routeMessage.js.
  const SUMMARY_SHORTCUTS = ["This week", "This month"];

  // Same pattern for data-query shortcuts — routes through the existing
  // (placeholder) data-query handler, which already returns an honest
  // "not yet implemented" response. No real query logic added here.
  const DATA_QUERY_SHORTCUTS = [
    "How much on stock?",
    "Top category this month",
    "Total spent this week",
  ];

  function handleQuickSummary(label) {
    handleSendText(`summarize ${label.toLowerCase()}`);
  }

  function handleQuickQuery(text) {
    handleSendText(text);
  }

  if (isEmpty) {
    return (
      <div className="chat-view chat-view-empty">
        <div className="hero-state">
          <h1 className="hero-headline">
            <span className="hero-dim">Tell </span>
            Vanta
            <span className="hero-dim"> what happened</span>
          </h1>
          <ParticleSphere size={340} />
          <div className="hero-input">
            <div className="quick-actions">
              {SUMMARY_SHORTCUTS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="quick-action-chip"
                  onClick={() => handleQuickSummary(label)}
                >
                  {label}
                </button>
              ))}
              {DATA_QUERY_SHORTCUTS.map((text) => (
                <button
                  key={text}
                  type="button"
                  className="quick-action-chip"
                  onClick={() => handleQuickQuery(text)}
                >
                  {text}
                </button>
              ))}
            </div>
            <MessageInput onSendText={handleSendText} onSendFile={handleSendFile} centered />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <MessageList
        messages={messages}
        onConfirmTransaction={handleConfirmTransaction}
        onEditTransaction={handleEditTransaction}
      />
      <div className="quick-actions quick-actions-inline">
        {SUMMARY_SHORTCUTS.map((label) => (
          <button
            key={label}
            type="button"
            className="quick-action-chip"
            onClick={() => handleQuickSummary(label)}
          >
            {label}
          </button>
        ))}
        {DATA_QUERY_SHORTCUTS.map((text) => (
          <button
            key={text}
            type="button"
            className="quick-action-chip"
            onClick={() => handleQuickQuery(text)}
          >
            {text}
          </button>
        ))}
      </div>
      <MessageInput onSendText={handleSendText} onSendFile={handleSendFile} />
    </div>
  );
}
