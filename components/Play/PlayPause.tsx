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
      className={`${styles.button} ${className}`}
      onClick={(e) => onChange(!isPlaying)}
      onTouchStart={(e) => onChange(!isPlaying)}
      aria-label={true ? "Pause button" : "Play button"}
    >
      <img
        className={styles.image}
        alt={isPlaying ? "Pause" : "Play"}
        src={isPlaying ? "/images/pause.svg" : "/images/play.svg"}
      />
    </button>
  );
}
