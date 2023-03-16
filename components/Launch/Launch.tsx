import React from "react";
import add from "date-fns/add";
import { geoInterpolate } from "d3-geo";
import { interpolateNumber } from "d3-interpolate";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";

import styles from "./Launch.module.css";
import { endPageTransition } from "../transitionPage";
import { UI } from "./UI";
import { LaunchWithData, Position } from "../../data/launch";

interface LaunchProps {
  isPlaying: boolean;
  playbackRate: number;
  launch: LaunchWithData<Date>;
}

export type Stage = 1 | 2;

interface StageSimulator {
  isDone: boolean;
  waypointIndex: number;
  waypointEndTime: Date;
  timeToNextWaypointMs: number;
  waypointInterpolators: {
    speed: (t: number) => number;
    altitude: (t: number) => number;
    position: (t: number) => [number, number];
  };
}

type StageSimulators = Record<Stage, StageSimulator>;

const Launch = React.memo(function Launch({ launch, isPlaying, playbackRate }: LaunchProps) {
  const { data } = launch;

  const pixiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const ui = React.useRef<UI>();
  const visualWorker = React.useRef<Worker | null>(null);
  const uiWorker = React.useRef<Worker | null>(null);

  const date = React.useRef(data.liftoffTime);
  const interval = React.useRef<NodeJS.Timer>();
  const stageSimulators = React.useRef<StageSimulators>(
    [1, 2].reduce((stages, n) => {
      const stage = n as Stage;
      stages[stage] = {
        isDone: false,
        waypointEndTime: data.telemetry.stage[stage][1].time,
        waypointIndex: 0,
        timeToNextWaypointMs: differenceInMilliseconds(
          data.telemetry.stage[stage][1].time,
          data.liftoffTime
        ),
        waypointInterpolators: {
          speed: interpolateNumber(0, data.telemetry.stage[stage][1].speed),
          altitude: interpolateNumber(0, data.telemetry.stage[stage][1].altitude),
          position: geoInterpolate(
            data.telemetry.stage[stage][0].position.slice().reverse() as Position,
            data.telemetry.stage[stage][1].position.slice().reverse() as Position
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

      // Notifications

      if (notification.current.endsAt) {
        if (date.current >= notification.current.endsAt) {
          uiWorker.current?.postMessage({
            type: "updateNotification",
            updateNotification: null,
          });
          // ui.current?.updateNotification(null);
          notification.current.endsAt = new Date();
        }
      }

      if (date.current >= notification.current.startsAt) {
        // 1. Remove possibly existing notifications from UI
        // ui.current?.updateNotification(null);
        uiWorker.current?.postMessage({
          type: "updateNotification",
          updateNotification: null,
        });
        // 2. Add notification to UI
        const newIndex = notification.current.index;
        const newNotification = launch.data.notifications[newIndex];
        notification.current = {
          index: newIndex + 1,
          endsAt: add(launch.data.notifications[newIndex]?.time, {
            seconds: 5,
          }),
          startsAt: launch.data.notifications[newIndex + 1]?.time || new Date(),
        };
        setTimeout(() => {
          ui.current?.updateNotification(newNotification);
          uiWorker.current?.postMessage({
            type: "updateNotification",
            updateNotification: null,
          });
        }, 200 / playbackRate);
      }

      // Telemetry
      for (let i = 1; i < 3; i++) {
        const stage = i as 1 | 2;

        const stageData = stageSimulators.current[stage];
        if (stageData.isDone) {
          // Break
          continue;
        }

        // Stage hasn't started yet
        if (date.current < data.telemetry.stage[stage][stageData.waypointIndex].time) {
          // Break
          continue;
        }

        if (date.current >= stageData.waypointEndTime) {
          stageData.waypointIndex = stageData.waypointIndex + 1;
          const checkpoint = data.telemetry.stage[stage][stageData.waypointIndex];

          const nextCheckpoint = data.telemetry.stage[stage][stageData.waypointIndex + 1];

          if (!nextCheckpoint) {
            stageData.isDone = true;

            visualWorker.current?.postMessage({
              type: "update",
              stage,
              altitude: checkpoint.altitude,
              position: checkpoint.position,
            });
            uiWorker.current?.postMessage({
              type: "updateUI",
              stage,
              date: date.current,
              speed: checkpoint.speed,
              altitude:
                checkpoint.altitude < 100
                  ? checkpoint.altitude.toFixed(1)
                  : Math.round(checkpoint.altitude),
            });

            continue;
          }

          stageData.timeToNextWaypointMs = differenceInMilliseconds(
            nextCheckpoint.time,
            checkpoint.time
          );
          stageData.waypointEndTime = nextCheckpoint.time;
          stageData.waypointInterpolators = {
            speed: interpolateNumber(checkpoint.speed, nextCheckpoint.speed),
            altitude: interpolateNumber(checkpoint.altitude, nextCheckpoint.altitude),
            position: geoInterpolate(
              checkpoint.position.slice().reverse() as Position,
              nextCheckpoint.position.slice().reverse() as Position
            ),
          };
        }

        const delta =
          (differenceInMilliseconds(date.current, stageData.waypointEndTime) +
            stageData.timeToNextWaypointMs) /
          stageData.timeToNextWaypointMs;

        const position = stageData.waypointInterpolators.position(delta);
        const altitude = stageData.waypointInterpolators.altitude(delta);
        const speed = Math.round(stageData.waypointInterpolators.speed(delta));

        visualWorker.current?.postMessage({
          type: "update",
          stage,
          altitude,
          position: position.slice().reverse() as Position,
        });
        uiWorker.current?.postMessage({
          type: "updateUI",
          stage,
          date: date.current,
          speed,
          altitude: altitude < 100 ? altitude.toFixed(1) : Math.round(altitude),
        });
      }
    }, delay);
  }, [playbackRate, data.telemetry.stage, launch.data.notifications]);

  React.useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
    }
    if (isPlaying) {
      start();
    }
  }, [start, isPlaying]);

  React.useEffect(() => {
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const resize = () => {
      requestAnimationFrame(() => {
        uiWorker.current?.postMessage({
          type: "resize",
          windowProperties: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
          },
        });
        visualWorker.current?.postMessage({
          type: "resize",
          windowProperties: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
          },
        });
      });
    };

    async function initialize() {
      // @ts-ignore
      const offscreen = threeCanvasRef.current.transferControlToOffscreen();
      visualWorker.current = new Worker(new URL("./visualization.worker.ts", import.meta.url));
      visualWorker.current.postMessage(
        {
          type: "init",
          canvas: offscreen,
          data,
          windowProperties: {
            devicePixelRatio: window.devicePixelRatio,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
          },
        },
        [offscreen]
      );

      // ui.current = await UI.ofElement(pixiCanvasRef.current as HTMLCanvasElement, launch);
      // @ts-ignore
      const offscreenUI = pixiCanvasRef.current.transferControlToOffscreen();
      uiWorker.current = new Worker(new URL("./ui.worker.ts", import.meta.url));
      uiWorker.current.postMessage(
        {
          type: "init",
          launch,
          canvas: offscreenUI,
          windowProperties: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
          },
        },
        [offscreenUI]
      );

      window.addEventListener("resize", resize);

      setTimeout(() => {
        requestAnimationFrame(() => {
          endPageTransition();
        });
      }, 200);
    }

    initialize();

    return () => {
      window.removeEventListener("resize", resize);
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
