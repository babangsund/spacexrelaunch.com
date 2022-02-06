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
      data-playing={isPlaying}
      className={styles.button}
      onClick={() => onToggle()}
    >
      <div className={styles.bars}>
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
      </div>
    </button>
  );
}
