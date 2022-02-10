import React from "react";

import styles from "./PlaybackRate.module.css";
import { ControlButton } from "../ControlButton/ControlButton";

interface PlaybackRateProps {
  rate: number;
  onChange: () => void;
}

export default function PlaybackRate({ rate, onChange }: PlaybackRateProps) {
  return (
    <ControlButton
      className={styles.button}
      onClick={() => onChange()}
      title="Increase playback rate"
      aria-label="Increase playback rate"
    >
      {rate}x
    </ControlButton>
  );
}

const playbackRates = [1, 2, 3, 5, 10, 50, 100];
const playbackRatesLength = playbackRates.length;

export function usePlaybackRate(): [number, () => void] {
  const index = React.useRef(1);
  const [playbackRate, setPlaybackRate] = React.useState(2);
  return [
    playbackRate,
    React.useCallback(() => {
      index.current = (index.current + 1) % playbackRatesLength;
      setPlaybackRate(playbackRates[index.current]);
    }, []),
  ];
}
