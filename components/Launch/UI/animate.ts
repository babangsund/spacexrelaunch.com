import { Easing, Tween } from "@tweenjs/tween.js";
import * as TWEEN from "@tweenjs/tween.js";
import { Ticker } from "@pixi/webworker";

type Callback<T> = (object: T) => void;

interface Animate<TValue, TTransitionValue> {
  startValue: TValue;
  endValue: TTransitionValue;
  durationMs: number;
  delayMs?: number;
  onStart?: Callback<TValue>;
  onUpdate?: Callback<TValue>;
  onComplete?: Callback<TValue>;
}

export function animate<TValue extends object, TTransitionValue extends Partial<TValue>>({
  startValue,
  endValue,
  durationMs,
  delayMs,
  onStart,
  onUpdate,
  onComplete,
}: Animate<TValue, TTransitionValue>) {
  const ticker = Ticker.shared;
  function animate() {
    TWEEN.update(ticker.lastTime);
  }

  new TWEEN.Tween(startValue)
    .to(endValue, durationMs)
    .delay(delayMs ?? 0)
    .onStart((value) => {
      onStart?.(value);
    })
    .onUpdate((value) => {
      onUpdate?.(value);
    })
    .onComplete((value) => {
      onComplete?.(value);
      // Stop animation loop
      ticker.remove(animate);
    })
    .start();

  ticker.add(animate);
}
