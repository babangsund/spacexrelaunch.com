import React from "react";

import styles from "./PlayPause.module.css";

interface PlayPauseProps {
  className?: string;
  isPlaying: boolean;
  onChange: (isPlaying: boolean) => void;
}

export default function PlayPause({
  onChange,
  isPlaying,
  className = "",
}: PlayPauseProps) {
  return (
    <button
      autoFocus
      type="button"
      title={isPlaying ? "Pause" : "Play"}
      onClick={(e) => onChange(!isPlaying)}
      aria-label={isPlaying ? "Pause" : "Play"}
      className={`${styles.button} ${className}`}
    >
      <img
        className={styles.image}
        alt={isPlaying ? "Pause" : "Play"}
        src={isPlaying ? "/images/pause.svg" : "/images/play.svg"}
      />
    </button>
  );
}
