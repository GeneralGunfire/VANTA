export default function UploadProgressMessage({ fileName, status, progress }) {
  const { done, total, failed } = progress;

  return (
    <div className="chat-row chat-row-bot">
      <div className="chat-card">
        <p className="upload-filename mono">{fileName}</p>
        {status === "processing" && (
          <p>
            Processing {done} / {total} rows
            {failed > 0 ? ` (${failed} failed)` : ""}…
          </p>
        )}
        {status === "done" && (
          <p>
            {failed > 0
              ? `${done - failed} succeeded, ${failed} failed out of ${total} rows.`
              : `${done} / ${total} rows processed successfully.`}
          </p>
        )}
      </div>
    </div>
  );
}
