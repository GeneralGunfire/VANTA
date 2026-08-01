import { useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'transcribing';

interface UseAudioRecorderResult {
  status: RecorderStatus;
  /** False when MediaRecorder or getUserMedia isn't available in this browser — the mic UI should hide/disable itself. */
  isSupported: boolean;
  startRecording: () => Promise<void>;
  /** Stops recording and resolves with the recorded audio blob, or null if nothing was recorded. */
  stopRecording: () => Promise<Blob | null>;
  /** Cancels an in-progress recording without producing a blob (e.g. user backs out). */
  cancelRecording: () => void;
  /** Returns to 'idle' after the caller has finished handling a transcription result or error. */
  reset: () => void;
}

/**
 * Thin wrapper around MediaRecorder — records one clip at a time (no
 * streaming/real-time transcription), releases the microphone stream as
 * soon as recording stops, and never surfaces a raw DOMException to the
 * caller. Permission handling and error messaging are the caller's job
 * (see ChatPage) so this stays a plain recording primitive.
 */
export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (!isSupported) throw new Error('Voice input is not supported on this device.');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    // Browsers reliably produce audio/webm via MediaRecorder — Groq's
    // Whisper endpoint accepts it directly, so no client-side transcoding
    // is needed. Falls back to the browser default mime type if webm
    // specifically isn't supported (e.g. some Safari versions).
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setStatus('recording');
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        releaseStream();
        const blob = chunksRef.current.length > 0
          ? new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          : null;
        chunksRef.current = [];
        setStatus('transcribing');
        resolve(blob);
      };

      recorder.stop();
    });
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    releaseStream();
    chunksRef.current = [];
    setStatus('idle');
  };

  const reset = () => setStatus('idle');

  return { status, isSupported, startRecording, stopRecording, cancelRecording, reset };
}
