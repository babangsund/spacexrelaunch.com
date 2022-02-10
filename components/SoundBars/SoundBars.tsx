import React from "react";

import styles from "./SoundBars.module.css";
import { ControlButton } from "../ControlButton/ControlButton";

interface SoundBarsProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export default function SoundBars({ onToggle, isPlaying }: SoundBarsProps) {
  return (
    <ControlButton
      data-playing={isPlaying}
      onClick={() => onToggle()}
      title={isPlaying ? "Mute" : "Unmute"}
      aria-label={isPlaying ? "Mute" : "Unmute"}
    >
      <div className={styles.bars}>
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
      </div>
    </ControlButton>
  );
}
