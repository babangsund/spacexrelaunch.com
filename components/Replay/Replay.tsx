import React from "react";
import { ControlButton } from "../ControlButton/ControlButton";

import styles from "./Replay.module.css";

interface ReplayProps {
  onClick: () => void;
}

export default function Replay({ onClick }: ReplayProps) {
  return (
    <ControlButton
      title="Replay"
      aria-label="Replay"
      onClick={(e) => onClick()}
    >
      <img alt="Replay" src="/images/replay.svg" className={styles.image} />
    </ControlButton>
  );
}
