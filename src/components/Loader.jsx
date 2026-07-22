import { useEffect, useState } from "react";
import "./Loader.css";

export default function Loader({
  size = 48,
  texts = ["Reading your message", "Adding it up", "Double-checking"],
}) {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((i) => (i + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="loader">
      <div className="loader-orb" style={{ width: size, height: size }}>
        <span className="loader-text">{texts[textIndex]}</span>
      </div>
    </div>
  );
}
