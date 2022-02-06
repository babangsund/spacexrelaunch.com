import React from "react";
import { useMusic } from "../useMusic";

import styles from "./SoundBars.module.css";

interface SoundBarsProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export default function SoundBars({ onToggle, isPlaying }: SoundBarsProps) {
  return (
    <button
      type="button"
      className={styles.bars}
      data-playing={isPlaying}
      onClick={() => onToggle()}
    >
      <div className={styles.bar} />
      <div className={styles.bar} />
      <div className={styles.bar} />
      <div className={styles.bar} />
      <div className={styles.bar} />
    </button>
  );
}
