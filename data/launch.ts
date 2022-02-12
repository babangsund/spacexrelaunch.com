type Timestamp = string | Date;

export type Position = [number, number];

interface LaunchStats {
  site: string;
  speed: number;
  altitude: number;
  liftoff: string;
  timeZone: string;
}

export interface LaunchSummary {
  img: string;
  name: string;
  stats: LaunchStats;
}

export interface LaunchTelemetry<TDate extends Timestamp> {
  time: TDate;
  speed: number;
  altitude: number;
  position: Position;
}

interface LaunchEvent<TDate extends Timestamp> {
  time: TDate;
  title: string;
}

export interface LaunchNotification<TDate extends Timestamp> {
  time: TDate;
  title: string;
  description: string;
}

export interface LaunchData<TDate extends Timestamp> {
  liftoffTime: TDate;
  events: LaunchEvent<TDate>[];
  notifications: LaunchNotification<TDate>[];
  telemetry: {
    stage: {
      1: LaunchTelemetry<TDate>[];
      2: LaunchTelemetry<TDate>[];
    };
  };
}

export interface LaunchWithData<TDate extends Timestamp> extends LaunchSummary {
  data: LaunchData<TDate>;
}

export function getLaunch(launchName: string): LaunchWithData<string> {
  const launch = getLaunches().find((l) => l.name === launchName)!;
  return {
    ...launch,
    data: require(`./launches/telemetry/${launchName
      .toLowerCase()
      .replace(" ", "_")}.json`),
  };
}

export function getLaunches(): LaunchSummary[] {
  return require("./launches/summaries.json");
}
