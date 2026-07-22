import { useEffect, useRef } from "react";
import UserMessage from "./UserMessage";
import PlainTextMessage from "./PlainTextMessage";
import ErrorMessage from "./ErrorMessage";
import TransactionCard from "./TransactionCard";
import UploadProgressMessage from "./UploadProgressMessage";
import Loader from "../Loader";

export default function MessageList({ messages, onConfirmTransaction, onEditTransaction }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg) => {
        switch (msg.type) {
          case "user":
            return <UserMessage key={msg.id} text={msg.text} />;
          case "bot-text":
            return <PlainTextMessage key={msg.id} text={msg.text} />;
          case "bot-error":
            return <ErrorMessage key={msg.id} text={msg.text} />;
          case "bot-loading":
            return (
              <div className="chat-row chat-row-bot" key={msg.id}>
                <Loader size={96} />
              </div>
            );
          case "bot-transaction":
            return (
              <TransactionCard
                key={msg.id}
                transaction={msg.transaction}
                onConfirmTransaction={(t) => onConfirmTransaction?.(msg.id, t)}
                onEditTransaction={(before, after) => onEditTransaction?.(msg.id, before, after)}
              />
            );
          case "bot-upload":
            return (
              <UploadProgressMessage
                key={msg.id}
                fileName={msg.fileName}
                status={msg.status}
                progress={msg.progress}
              />
            );
          default:
            return null;
        }
      })}
      <div ref={endRef} />
    </div>
  );
}
