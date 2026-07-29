import React from 'react';
import { motion } from 'motion/react';

interface TextGenerateEffectProps {
  words: string;
  className?: string;
}

/** Aceternity/Magic UI-style word-by-word reveal, staggered left to right. */
export function TextGenerateEffect({ words, className }: TextGenerateEffectProps) {
  const wordList = words.split(' ');

  return (
    <span className={className}>
      {wordList.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, filter: 'blur(6px)', y: 6 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="inline-block"
        >
          {word}
          {i < wordList.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
}
