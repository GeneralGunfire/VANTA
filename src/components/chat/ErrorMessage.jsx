export default function ErrorMessage({ text }) {
  return (
    <div className="chat-row chat-row-bot">
      <div className="chat-card chat-card-error">
        <p>{text}</p>
      </div>
    </div>
  );
}
