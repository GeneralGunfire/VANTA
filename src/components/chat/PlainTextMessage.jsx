export default function PlainTextMessage({ text }) {
  return (
    <div className="chat-row chat-row-bot">
      <div className="chat-card">
        <p>{text}</p>
      </div>
    </div>
  );
}
