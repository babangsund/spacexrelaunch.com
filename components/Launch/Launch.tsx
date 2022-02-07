import React from "react";

import { geoInterpolate } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { extent } from "d3-array";
import { interpolateNumber } from "d3-interpolate";

import { makeUI, UpdateUI } from "./UI/ui";
import { makeVisual } from "./3d/visual";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import differenceInSeconds from "date-fns/differenceInSeconds";

import { LaunchWithData, Position } from "../../data/launch";
import styles from "./Launch.module.css";
import { endPageTransition } from "../transitionPage";

interface LaunchProps {
  isPlaying: boolean;
  playbackRate: number;
  launch: LaunchWithData<Date>;
}

type UpdateVisual = (data: {
  date: Date;
  speed: number;
  stage: number;
  altitude: number;
  position: Position;
}) => void;

const Launch = React.memo(function Launch({
  launch,
  isPlaying,
  playbackRate,
}: LaunchProps) {
  const { data } = launch;

  const pixiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const onUIChange = React.useRef<UpdateUI>(() => {});
  const onVisualChange = React.useRef<UpdateVisual>(() => {});

  const interval = React.useRef<NodeJS.Timer>();
  const date = React.useRef(data.liftoffTime);
  const endDate = React.useRef(data.telemetry[1].time);
  const secondsPassed = React.useRef(0);
  const checkpointIndex = React.useRef(0);
  const interpolators = React.useRef({
    speed: interpolateNumber(0, data.telemetry[1].speed),
    altitude: interpolateNumber(0, data.telemetry[1].altitude),
    position: geoInterpolate(
      data.telemetry[0].position.slice().reverse() as Position,
      data.telemetry[1].position.slice().reverse() as Position
    ),
  });

  const msFromLastToNextTelemetry = React.useRef(
    differenceInMilliseconds(data.telemetry[1].time, data.liftoffTime)
  );

  const start = React.useCallback(() => {
    const delay = 25;
    const mECOTime = data.events.find((e) => e.title === "MECO")!.time;

    interval.current = setInterval(() => {
      const newDate = new Date(date.current.getTime() + 25 * playbackRate);

      date.current = newDate;
      secondsPassed.current = differenceInSeconds(newDate, data.liftoffTime);

      if (date.current >= endDate.current) {
        // TODO: Handle no next checkpoint

        checkpointIndex.current = checkpointIndex.current + 1;
        const checkpoint = data.telemetry[checkpointIndex.current];
        const nextCheckpoint = data.telemetry[checkpointIndex.current + 1];

        if (!nextCheckpoint) {
          if (interval.current !== undefined) {
            clearInterval(interval.current);
          }
          return;
        }

        msFromLastToNextTelemetry.current = differenceInMilliseconds(
          nextCheckpoint.time,
          checkpoint.time
        );

        endDate.current = nextCheckpoint.time;

        interpolators.current = {
          speed: interpolateNumber(checkpoint.speed, nextCheckpoint.speed),
          altitude: interpolateNumber(
            checkpoint.altitude,
            nextCheckpoint.altitude
          ),
          position: geoInterpolate(
            checkpoint.position.slice().reverse() as Position,
            nextCheckpoint.position.slice().reverse() as Position
          ),
        };
      }

      const delta =
        (differenceInMilliseconds(date.current, endDate.current) +
          msFromLastToNextTelemetry.current) /
        msFromLastToNextTelemetry.current;

      const altitude = interpolators.current.altitude(delta);
      const speed = Math.round(interpolators.current.speed(delta));
      const position = interpolators.current.position(delta);
      const stage = date.current > mECOTime ? 2 : 1;

      onVisualChange.current({
        stage,
        date: date.current,
        speed,
        altitude,
        position: position.slice().reverse() as Position,
      });

      onUIChange.current({
        date: date.current,
        speed,
        secondsPassed: secondsPassed.current,
        altitude: altitude < 100 ? altitude.toFixed(1) : Math.round(altitude),
      });
    }, delay);
  }, [data, playbackRate]);

  React.useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
    }
    if (isPlaying) {
      start();
    }
  }, [start, isPlaying]);

  React.useEffect(() => {
    async function run() {
      const altitudeScale = scaleLinear()
        .domain(extent(data.telemetry, (t) => t.altitude) as [number, number])
        .range([0, 5]);

      onVisualChange.current = await makeVisual(
        threeCanvasRef.current as HTMLCanvasElement,
        data,
        altitudeScale
      );
      onUIChange.current = await makeUI(
        pixiCanvasRef.current as HTMLCanvasElement,
        launch
      );

      setTimeout(() => {
        requestAnimationFrame(() => {
          endPageTransition();
        });
      }, 200);
    }

    run();

    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [launch, data]);

  return (
    <div>
      <canvas className={styles.canvas} id="threeCanvas" ref={threeCanvasRef} />
      <canvas className={styles.uiCanvas} ref={pixiCanvasRef} />
    </div>
  );
});

export default Launch;
