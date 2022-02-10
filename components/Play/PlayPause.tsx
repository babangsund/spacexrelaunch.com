import React from "react";
import { ControlButton } from "../ControlButton/ControlButton";

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
    <ControlButton
      className={className}
      title={isPlaying ? "Pause" : "Play"}
      onClick={() => onChange(!isPlaying)}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      <img
        className={styles.image}
        alt={isPlaying ? "Pause" : "Play"}
        src={isPlaying ? "/images/pause.svg" : "/images/play.svg"}
      />
    </ControlButton>
  );
}
