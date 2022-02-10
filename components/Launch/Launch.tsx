import React from "react";

import { geoInterpolate } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { extent } from "d3-array";
import { interpolateNumber } from "d3-interpolate";

import { makeUI, UpdateUI } from "./UI/ui";
import { makeVisual, UpdateVisual } from "./3d/visual";
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

  const secondsPassed = React.useRef(0);
  const date = React.useRef(data.liftoffTime);
  const interval = React.useRef<NodeJS.Timer>();
  const simulators = React.useRef<any>({
    stage: {
      1: {
        endDate: data.telemetry.stage[1][1].time,
        checkpointIndex: 0,
        msFromLastToNextTelemetry: differenceInMilliseconds(
          data.telemetry.stage[1][1].time,
          data.liftoffTime
        ),
        interpolators: {
          speed: interpolateNumber(0, data.telemetry.stage[1][1].speed),
          altitude: interpolateNumber(0, data.telemetry.stage[1][1].altitude),
          position: geoInterpolate(
            data.telemetry.stage[1][0].position.slice().reverse() as Position,
            data.telemetry.stage[1][1].position.slice().reverse() as Position
          ),
        },
      },
      2: {
        checkpointIndex: 0,
        endDate: data.telemetry.stage[2][1].time,
        msFromLastToNextTelemetry: differenceInMilliseconds(
          data.telemetry.stage[2][1].time,
          data.liftoffTime
        ),
        interpolators: {
          speed: interpolateNumber(0, data.telemetry.stage[2][1].speed),
          altitude: interpolateNumber(0, data.telemetry.stage[2][1].altitude),
          position: geoInterpolate(
            data.telemetry.stage[2][0].position.slice().reverse() as Position,
            data.telemetry.stage[2][1].position.slice().reverse() as Position
          ),
        },
      },
    },
  });

  const start = React.useCallback(() => {
    const delay = 25;

    interval.current = setInterval(function hello() {
      const newDate = new Date(date.current.getTime() + 25 * playbackRate);

      date.current = newDate;
      secondsPassed.current = differenceInSeconds(newDate, data.liftoffTime);

      for (let i = 1; i < 3; i++) {
        const stage = i as 1 | 2;

        const stageData = simulators.current.stage[stage];
        if (stageData.done) {
          // Break
          continue;
        }

        // Stage hasn't started yet
        if (
          date.current <
          data.telemetry.stage[stage][stageData.checkpointIndex].time
        ) {
          // Break
          continue;
        }

        if (date.current >= stageData.endDate) {
          stageData.checkpointIndex = stageData.checkpointIndex + 1;
          const checkpoint =
            data.telemetry.stage[stage][stageData.checkpointIndex];

          const nextCheckpoint =
            data.telemetry.stage[stage][stageData.checkpointIndex + 1];

          if (!nextCheckpoint) {
            stageData.done = true;

            onVisualChange.current({
              stage,
              altitude: checkpoint.altitude,
              position: checkpoint.position,
            });
            onUIChange.current({
              stage,
              date: date.current,
              speed: checkpoint.speed,
              secondsPassed: secondsPassed.current,
              altitude:
                checkpoint.altitude < 100
                  ? checkpoint.altitude.toFixed(1)
                  : Math.round(checkpoint.altitude),
            });

            continue;
          }

          stageData.msFromLastToNextTelemetry = differenceInMilliseconds(
            nextCheckpoint.time,
            checkpoint.time
          );
          stageData.endDate = nextCheckpoint.time;
          stageData.interpolators = {
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
          (differenceInMilliseconds(date.current, stageData.endDate) +
            stageData.msFromLastToNextTelemetry) /
          stageData.msFromLastToNextTelemetry;

        const altitude = stageData.interpolators.altitude(delta);
        const speed = Math.round(stageData.interpolators.speed(delta));
        const position = stageData.interpolators.position(delta);

        onVisualChange.current({
          stage,
          altitude,
          position: position.slice().reverse() as Position,
        });

        onUIChange.current({
          stage,
          date: date.current,
          speed,
          secondsPassed: secondsPassed.current,
          altitude: altitude < 100 ? altitude.toFixed(1) : Math.round(altitude),
        });
      }
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
    async function initialize() {
      const altitudeScale = scaleLinear()
        .domain(
          extent(
            data.telemetry.stage[1].concat(data.telemetry.stage[2]),
            (t) => t.altitude
          ) as [number, number]
        )
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

    initialize();

    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [launch, data]);

  return (
    <>
      <canvas className={styles.canvas} id="threeCanvas" ref={threeCanvasRef} />
      <canvas className={styles.uiCanvas} ref={pixiCanvasRef} />
    </>
  );
});

export default Launch;
