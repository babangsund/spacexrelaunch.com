import React from "react";

import styles from "./ControlButton.module.css";

interface ControlButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  children: React.ReactNode;
}

export function ControlButton({
  children,
  ...buttonProps
}: ControlButtonProps) {
  return (
    <button
      {...buttonProps}
      className={`${styles.button} ${buttonProps.className || ""}`}
    >
      {children}
    </button>
  );
}
