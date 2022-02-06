// @ts-nocheck

import React from "react";

import { geoInterpolate } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { extent } from "d3-array";
import { interpolateNumber } from "d3-interpolate";

import { makeUI } from "./UI/ui";
import { makeVisual } from "./3d/visual";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import differenceInSeconds from "date-fns/differenceInSeconds";

import { LaunchData } from "../../data/launch";
import styles from "./Launch.module.css";
import { endPageTransition } from "../transitionPage";

interface LaunchProps {
  isPlaying: boolean;
  playbackRate: number;
  launch: LaunchData<Date>;
}

const Launch = React.memo(function Launch({
  launch,
  isPlaying,
  playbackRate,
}: LaunchProps) {
  const pixiCanvasRef = React.useRef(null);
  const threeCanvasRef = React.useRef(null);

  const onUIChange = React.useRef();
  const onVisualChange = React.useRef();

  const interval = React.useRef(0);
  const date = React.useRef(launch.liftoffTime);
  const endDate = React.useRef(launch.telemetry[1].time);
  const secondsPassed = React.useRef(0);
  const checkpointIndex = React.useRef(0);
  const interpolators = React.useRef({
    speed: interpolateNumber(0, launch.telemetry[1].speed),
    altitude: interpolateNumber(0, launch.telemetry[1].altitude),
    position: geoInterpolate(
      launch.telemetry[0].position.slice().reverse(),
      launch.telemetry[1].position.slice().reverse()
    ),
  });

  const msFromLastToNextTelemetry = React.useRef(
    differenceInMilliseconds(launch.telemetry[1].time, launch.liftoffTime)
  );

  const start = React.useCallback(() => {
    const delay = 25;
    interval.current = setInterval(() => {
      const newDate = new Date(date.current.getTime() + 25 * playbackRate);

      date.current = newDate;
      secondsPassed.current = differenceInSeconds(newDate, launch.liftoffTime);

      if (date.current >= endDate.current) {
        // TODO: Handle no next checkpoint

        checkpointIndex.current = checkpointIndex.current + 1;
        const checkpoint = launch.telemetry[checkpointIndex.current];
        const nextCheckpoint = launch.telemetry[checkpointIndex.current + 1];

        if (!nextCheckpoint) {
          clearInterval(interval.current);
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
            checkpoint.position.slice().reverse(),
            nextCheckpoint.position.slice().reverse()
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

      onVisualChange.current({
        date: date.current,
        speed,
        altitude,
        position: position.slice().reverse(),
      });

      onUIChange.current({
        date: date.current,
        speed,
        secondsPassed: secondsPassed.current,
        altitude: altitude < 100 ? altitude.toFixed(1) : Math.round(altitude),
      });
    }, delay);
  }, [launch, playbackRate]);

  React.useEffect(() => {
    clearInterval(interval.current);
    if (isPlaying) {
      start();
    }
  }, [start, isPlaying]);

  React.useEffect(() => {
    async function run() {
      const altitudeScale = scaleLinear()
        .domain(extent(launch.telemetry, (t) => t.altitude))
        .range([0, 5]);

      onVisualChange.current = await makeVisual(
        threeCanvasRef.current,
        launch,
        altitudeScale
      );
      onUIChange.current = await makeUI(pixiCanvasRef.current, launch);

      setTimeout(() => {
        endPageTransition();
      }, 200);
    }

    run();

    return () => {
      clearInterval(interval.current);
    };
  }, [launch]);

  return (
    <div>
      <canvas className={styles.canvas} id="threeCanvas" ref={threeCanvasRef} />
      <canvas className={styles.uiCanvas} ref={pixiCanvasRef} />
    </div>
  );
});

export default Launch;
