export default function UserMessage({ text }) {
  return (
    <div className="chat-row chat-row-user">
      <div className="chat-bubble chat-bubble-user">{text}</div>
    </div>
  );
}
