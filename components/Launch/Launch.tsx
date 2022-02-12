import React from "react";
import add from "date-fns/add";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { geoInterpolate } from "d3-geo";
import { interpolateNumber } from "d3-interpolate";
import differenceInSeconds from "date-fns/differenceInSeconds";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";

import styles from "./Launch.module.css";
import { makeUI, UpdateUI } from "./UI/ui";
import { endPageTransition } from "../transitionPage";
import { makeVisual, UpdateVisual } from "./3d/visual";
import { LaunchWithData, Position } from "../../data/launch";

interface LaunchProps {
  isPlaying: boolean;
  playbackRate: number;
  launch: LaunchWithData<Date>;
}

type Stage = 1 | 2;

interface StageSimulator {
  done: boolean;
  endDate: Date;
  checkpointIndex: number;
  msFromLastToNextTelemetry: number;
  interpolators: {
    speed: (t: number) => number;
    altitude: (t: number) => number;
    position: (t: number) => [number, number];
  };
}

type StageSimulators = Record<Stage, StageSimulator>;

const Launch = React.memo(function Launch({
  launch,
  isPlaying,
  playbackRate,
}: LaunchProps) {
  const { data } = launch;

  // Display notifications for 6 seconds

  const pixiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const onUIChange = React.useRef<UpdateUI>(() => {});
  const onVisualChange = React.useRef<UpdateVisual>(() => {});
  const onNotificationChange = React.useRef<Function>(() => {});

  const secondsPassed = React.useRef(0);
  const date = React.useRef(data.liftoffTime);
  const interval = React.useRef<NodeJS.Timer>();
  const stageSimulators = React.useRef<StageSimulators>(
    [1, 2].reduce((stages, n) => {
      const stage = n as Stage;
      stages[stage] = {
        done: false,
        endDate: data.telemetry.stage[stage][1].time,
        checkpointIndex: 0,
        msFromLastToNextTelemetry: differenceInMilliseconds(
          data.telemetry.stage[stage][1].time,
          data.liftoffTime
        ),
        interpolators: {
          speed: interpolateNumber(0, data.telemetry.stage[stage][1].speed),
          altitude: interpolateNumber(
            0,
            data.telemetry.stage[stage][1].altitude
          ),
          position: geoInterpolate(
            data.telemetry.stage[stage][0].position
              .slice()
              .reverse() as Position,
            data.telemetry.stage[stage][1].position
              .slice()
              .reverse() as Position
          ),
        },
      };
      return stages;
    }, {} as StageSimulators)
  );

  const notification = React.useRef({
    index: 0,
    startsAt: launch.data.notifications[0].time,
    endsAt: add(launch.data.notifications[0].time, { seconds: 5 }),
  });

  const start = React.useCallback(() => {
    const delay = 25;

    interval.current = setInterval(function start() {
      const newDate = new Date(date.current.getTime() + 25 * playbackRate);

      date.current = newDate;
      secondsPassed.current = differenceInSeconds(newDate, data.liftoffTime);

      // Notifications

      if (notification.current.endsAt) {
        if (date.current >= notification.current.endsAt) {
          onNotificationChange.current(null);
          notification.current.endsAt = new Date();
        }
      }

      if (date.current >= notification.current.startsAt) {
        // 1. Remove possibly existing notifications from UI
        onNotificationChange.current(null);
        // 2. Add notification to UI
        const newIndex = notification.current.index;
        const newNotification = launch.data.notifications[newIndex];
        notification.current = {
          index: newIndex + 1,
          endsAt: add(launch.data.notifications[newIndex]?.time, {
            seconds: 4,
          }),
          startsAt: launch.data.notifications[newIndex + 1]?.time || new Date(),
        };
        setTimeout(() => {
          onNotificationChange.current(newNotification);
        }, 200 / playbackRate);
      }

      // Telemetry
      for (let i = 1; i < 3; i++) {
        const stage = i as 1 | 2;

        const stageData = stageSimulators.current[stage];
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

      const { updateUI, updateNotification } = await makeUI(
        pixiCanvasRef.current as HTMLCanvasElement,
        launch
      );

      onUIChange.current = updateUI;
      onNotificationChange.current = updateNotification;

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
