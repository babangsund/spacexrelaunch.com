import { geoInterpolate } from "d3-geo";
import { interpolateNumber } from "d3-interpolate";
import { add, differenceInMilliseconds } from "date-fns";
import { LaunchWithData, Position } from "../../data/launch";

export type Stage = 1 | 2;

interface SimulationWorkerMessage {
  type: "sim::init" | "sim::start" | "sim::stop" | "sim::playbackRate";
  playbackRate: number;
  launch: LaunchWithData<Date>;
  visPort: MessagePort;
  uiPort: MessagePort;
}

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

interface Notification {
  index: number;
  startsAt: Date;
  endsAt: Date;
}

type StageSimulators = Record<Stage, StageSimulator>;

let date: Date;
let interval: null | NodeJS.Timer = null;
let stageSimulators: StageSimulators;

let notification: Notification;

let uiPort: null | MessagePort = null;
let visPort: null | MessagePort = null;

let start: Function;

let playbackRate: number;

self.onmessage = async (event: MessageEvent<SimulationWorkerMessage>) => {
  const { type, launch, uiPort: uiPortProp, visPort: visPortProp } = event.data;

  // Write a switch statement for every type
  switch (type) {
    case "sim::init": {
      init();
      break;
    }
    case "sim::start": {
      start();
      break;
    }
    case "sim::playbackRate": {
      playbackRate = event.data.playbackRate;
      break;
    }
    case "sim::stop": {
      if (interval) {
        clearInterval(interval);
      }
    }
    default:
      break;
  }

  function init() {
    uiPort = uiPortProp;
    visPort = visPortProp;

    playbackRate = event.data.playbackRate;

    const { data: launchData } = launch;

    date = launchData.liftoffTime;

    stageSimulators = [1, 2].reduce((stages, n) => {
      const stage = n as Stage;
      stages[stage] = {
        isDone: false,
        waypointEndTime: launchData.telemetry.stage[stage][1].time,
        waypointIndex: 0,
        timeToNextWaypointMs: differenceInMilliseconds(
          launchData.telemetry.stage[stage][1].time,
          launchData.liftoffTime
        ),
        waypointInterpolators: {
          speed: interpolateNumber(0, launchData.telemetry.stage[stage][1].speed),
          altitude: interpolateNumber(0, launchData.telemetry.stage[stage][1].altitude),
          position: geoInterpolate(
            launchData.telemetry.stage[stage][0].position.slice().reverse() as Position,
            launchData.telemetry.stage[stage][1].position.slice().reverse() as Position
          ),
        },
      };
      return stages;
    }, {} as StageSimulators);

    notification = {
      index: 0,
      startsAt: launch.data.notifications[0].time,
      endsAt: add(launch.data.notifications[0].time, { seconds: 5 }),
    };

    start = () => {
      const delay = 25;

      interval = setInterval(function start() {
        const newDate = new Date(date.getTime() + 25 * playbackRate);

        date = newDate;

        // Notifications

        if (notification.endsAt) {
          if (date >= notification.endsAt) {
            uiPort?.postMessage({
              type: "ui::updateNotification",
              updateNotification: null,
            });
            notification.endsAt = new Date();
          }
        }

        if (date >= notification.startsAt) {
          // 1. Remove possibly existing notifications from UI
          uiPort?.postMessage({
            type: "ui::updateNotification",
            updateNotification: null,
          });
          // 2. Add notification to UI
          const newIndex = notification!.index;
          const newNotification = launch.data.notifications[newIndex];
          notification = {
            index: newIndex + 1,
            endsAt: add(launch.data.notifications[newIndex]?.time, {
              seconds: 5,
            }),
            startsAt: launch.data.notifications[newIndex + 1]?.time || new Date(),
          };
          setTimeout(() => {
            uiPort?.postMessage({
              type: "ui::updateNotification",
              updateNotification: newNotification,
            });
          }, 200 / playbackRate);
        }

        // Telemetry
        for (let i = 1; i < 3; i++) {
          const stage = i as 1 | 2;

          const stageData = stageSimulators?.[stage];
          if (stageData.isDone) {
            // Break
            continue;
          }

          // Stage hasn't started yet
          if (date < launchData.telemetry.stage[stage][stageData.waypointIndex].time) {
            // Break
            continue;
          }

          if (date >= stageData.waypointEndTime) {
            stageData.waypointIndex = stageData.waypointIndex + 1;
            const checkpoint = launchData.telemetry.stage[stage][stageData.waypointIndex];

            const nextCheckpoint = launchData.telemetry.stage[stage][stageData.waypointIndex + 1];

            if (!nextCheckpoint) {
              stageData.isDone = true;

              visPort?.postMessage({
                type: "vis::update",
                stage,
                altitude: checkpoint.altitude,
                position: checkpoint.position,
              });
              uiPort?.postMessage({
                type: "ui::update",
                stage,
                date: date,
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
            (differenceInMilliseconds(date, stageData.waypointEndTime) +
              stageData.timeToNextWaypointMs) /
            stageData.timeToNextWaypointMs;

          const position = stageData.waypointInterpolators.position(delta);
          const altitude = stageData.waypointInterpolators.altitude(delta);
          const speed = Math.round(stageData.waypointInterpolators.speed(delta));

          visPort?.postMessage({
            type: "vis::update",
            stage,
            altitude,
            position: position.slice().reverse() as Position,
          });
          uiPort?.postMessage({
            type: "ui::update",
            stage,
            date: date,
            speed,
            altitude: altitude < 100 ? altitude.toFixed(1) : Math.round(altitude),
          });
        }
      }, delay);
    };
  }
};

export {};
