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
      type="button"
      onClick={(e) => onChange(!isPlaying)}
      onTouchStart={(e) => onChange(!isPlaying)}
      className={`${styles.button} ${className}`}
      aria-label={true ? "Pause button" : "Play button"}
    >
      <img
        alt={isPlaying ? "Pause" : "Play"}
        className={styles.image}
        src={isPlaying ? "/images/pause.svg" : "/images/play.svg"}
      />
    </button>
  );
}
