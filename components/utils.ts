import React from "react";

type AngleInDegrees = number;
type AngleinRadians = number;

export function toRadians(angle: AngleInDegrees) {
  return angle * (Math.PI / 180);
}

export function toDegrees(angle: AngleinRadians) {
  return angle * (180 / Math.PI);
}

export function convertRelativeScale(
  numberToConvert: number,
  [oldMin, oldMax]: [number, number],
  [newMin, newMax]: [number, number]
) {
  const percent = (numberToConvert - oldMin) / (oldMax - oldMin);
  return percent * (newMax - newMin) + newMin;
}

export function useMounted() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
