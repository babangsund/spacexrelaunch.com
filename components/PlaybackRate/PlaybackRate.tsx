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
  const [{ playbackRate }, setPlaybackRate] = React.useState({
    index: 0,
    playbackRate: 1,
  });
  return [
    playbackRate,
    React.useCallback(() => {
      setPlaybackRate(({ index }) => {
        const newIndex = (index + 1) % playbackRatesLength;
        return {
          index: newIndex,
          playbackRate: playbackRates[newIndex],
        };
      });
    }, []),
  ];
}
