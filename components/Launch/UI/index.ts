import FontFaceObserver from "fontfaceobserver";
import differenceInSeconds from "date-fns/differenceInSeconds";
import differenceInMinutes from "date-fns/differenceInMinutes";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import {
  Assets,
  Text,
  Sprite,
  Graphics,
  Container,
  BitmapText,
  BitmapFont,
  Application,
} from "@pixi/webworker";

import { animate } from "./animate";
import { makeGauge } from "./gauge";
import { convertRelativeScale, toRadians } from "../../utils";
import { byScreenSize } from "../../screenSize";
import { LaunchEvent, LaunchNotification, LaunchWithData } from "../../../data/launch";

interface Updaters {
  updateSpeed: Function;
  updateAltitude: Function;
}

interface ByStage<T> {
  1?: T;
  2?: T;
}

type StageUpdaters = ByStage<Updaters>;

type WindowProperties = Pick<Window, "innerWidth" | "innerHeight" | "devicePixelRatio">;

export type UpdateNotification = (launchNotification: null | LaunchNotification<Date>) => void;

export type UpdateUI = (data: {
  stage: 1 | 2;
  date: Date;
  speed: number;
  altitude: number | string;
}) => void;

function loadBitmapFonts() {
  const bitmapCharacters = BitmapFont.ALPHANUMERIC.concat([".", "/", "+", ":", "-"]);

  BitmapFont.from(
    "BlenderPro500",
    {
      fontSize: 72,
      fill: "#ffffff",
      align: "center",
      fontFamily: "Blender Pro",
      fontWeight: "500",
    },
    { chars: bitmapCharacters }
  );
  BitmapFont.from(
    "BlenderPro700",
    {
      fontSize: 72,
      fill: "#ffffff",
      align: "center",
      fontFamily: "Blender Pro",
      fontWeight: "700",
    },
    { chars: bitmapCharacters }
  );
}

Assets.add("BlenderPro500", "/fonts/BlenderPro/BlenderPro-Medium.woff2");
Assets.add("BlenderPro700", "/fonts/BlenderPro/BlenderPro-Bold.woff2");

const fontsPromise = Promise.all([Assets.load(["BlenderPro500", "BlenderPro700"])]).then(
  loadBitmapFonts
);

Assets.add("gauge-shadow", "/images/gauge-shadow.png");
Assets.add("outer-shadow", "/images/outer-shadow.png");
Assets.add("side-shadow-left", "/images/side-shadow-left.png");
Assets.add("side-shadow-right", "/images/side-shadow-right.png");

const texturesPromise = [
  Assets.load(["gauge-shadow", "outer-shadow", "side-shadow-left", "side-shadow-right"]),
];

const resourcesPromise = Promise.all([fontsPromise, texturesPromise]);

function getTimelineAlpha(angle: number) {
  if (angle > 180) {
    angle = angle - 360;
  }
  return 1 - Math.abs((angle / 90) * 90) / 25 + 0.25; // 25 and 0.25 are arbitrary values
}

function doesNeedResize(renderer: any, windowProperties: WindowProperties) {
  const canvas = renderer.view;
  const width = windowProperties.innerWidth;
  const height = windowProperties.innerHeight;
  const needResize = canvas.clientWidth !== width || canvas.clientHeight !== height;

  return needResize;
}

const toTwoDigit = (n: number) => (n < 10 ? "0".concat(String(n)) : String(n));

function getCountdown(startDate: Date, endDate: Date) {
  const secondsLeft = differenceInSeconds(endDate, startDate);
  const hoursLeft = secondsLeft / 3600;
  const minutesLeft = secondsLeft / 60;

  const hours = Math.floor(hoursLeft);
  const minutes = Math.floor(minutesLeft - hours * 60);
  const seconds = secondsLeft - hours * 3600 - minutes * 60;

  return `T + ${toTwoDigit(hours)}:${toTwoDigit(minutes)}:${toTwoDigit(seconds)}`;
}

function getPositionOnTimeline(radius: number, total: number, part: number) {
  const angle = (360 / total) * part;

  const radian = angle * (Math.PI / 180);

  const x = radius * Math.cos((2 * Math.PI * part) / total);
  const y = radius * Math.sin((2 * Math.PI * part) / total);

  return { x, y, angle, radian };
}

function createPIXI(view: HTMLCanvasElement, windowProperties: WindowProperties) {
  const app = new Application({
    view,
    // resizeTo: view,
    antialias: true,
    backgroundAlpha: 0,
    // autoDensity: true,
    width: windowProperties.innerWidth,
    height: windowProperties.innerHeight,
    powerPreference: "high-performance",
    resolution: windowProperties.devicePixelRatio || 1,
  });

  return app;
}

interface TimelineEvent {
  time: Date;
  title: string;
  passed?: boolean;
  cpContainer: Container;
}

// TODO: Set visible events by event
function addTimelineEvents(
  events: LaunchEvent<Date>[],
  totalMs: number,
  radius: number,
  liftoffTime: Date,
  wheel: Graphics
) {
  const wheelEvents: TimelineEvent[] = [];

  events.forEach((event, index) => {
    const isAbove = index % 2 === 0;

    const { x, y, angle } = getPositionOnTimeline(
      radius,
      totalMs,
      differenceInMilliseconds(event.time, liftoffTime)
    );
    const cpContainer = new Container();

    cpContainer.x = x;
    cpContainer.y = y;
    cpContainer.angle = angle;

    const lineHeight = 8;
    const circleRadius = 8;

    // TODO:
    // Add to container and add text
    const circle = new Graphics();
    circle.beginFill(0x000000);
    circle.drawCircle(0, 0, circleRadius);
    circle.endFill();

    circle.lineStyle(2, 0xffffff); //(thickness, color)
    circle.drawCircle(0, 0, circleRadius);
    circle.endFill();

    circle.name = "circle";

    const line = new Graphics();
    line.beginFill(0xffffff);
    line.drawRect(0, 0, 2, lineHeight);
    line.endFill();
    line.angle = isAbove ? -90 : 90;
    line.x = isAbove ? circleRadius : -8;
    line.y = isAbove ? 1 : -1;

    const text = new BitmapText(event.title, {
      fontName: "BlenderPro700",
      fontSize: byScreenSize({ xs: 8, s: 10, m: 12, l: 14, xl: 16 }),
    });

    text.name = "text";

    text.angle = 90;
    text.x = isAbove ? lineHeight * 2 + text.height : -(lineHeight + text.height / 2);
    text.y = -(text.width / 2);

    cpContainer.addChild(circle, text, line);
    wheel.addChild(cpContainer);
    wheelEvents.push({ cpContainer, time: event.time, title: event.title });
    cpContainer.visible = false;
  });

  return wheelEvents;
}

function addTimeline(app: Application, radius: number) {
  const timelineContainer = new Container();
  timelineContainer.x = app.screen.width / 2;
  timelineContainer.y = app.screen.height + radius - byScreenSize({ xs: 110, s: 130, l: 150 });
  app.stage.addChild(timelineContainer);

  // Low opacity full circle
  const timelineBackgroundLine = new Graphics();
  timelineBackgroundLine.lineStyle(3, 0xffffff);
  timelineBackgroundLine.drawCircle(0, 0, radius);
  timelineBackgroundLine.endFill();
  timelineBackgroundLine.alpha = 0.5;
  timelineContainer.addChild(timelineBackgroundLine);

  // Full opacity half circle
  const timelineForegroundLine = new Graphics();
  timelineForegroundLine.lineStyle(3, 0xffffff);
  timelineForegroundLine.arc(0, 0, radius, toRadians(-180), toRadians(-90));
  timelineContainer.addChild(timelineForegroundLine);

  // Tick in the center
  const timelineCenter = new Graphics();
  timelineCenter
    .beginFill(0xffffff)
    .drawRect(0, -radius - 4, 2, 8)
    .endFill();
  timelineCenter.rotation = toRadians(0);
  timelineForegroundLine.addChild(timelineCenter);

  // Outer gradient shadow
  const outerShadow = Sprite.from("/images/outer-shadow.png");
  outerShadow.anchor.set(0.5);
  outerShadow.width = radius * 2 + 100;
  outerShadow.height = radius * 2 + 100;
  timelineContainer.addChild(outerShadow);

  // Inner solid shadow
  const innerShadow = new Graphics();
  innerShadow.beginFill(0x000000);
  innerShadow.drawCircle(0, 0, radius - 50);
  innerShadow.endFill();
  innerShadow.alpha = 0.4;
  timelineContainer.addChild(innerShadow);

  // Inner Timeline
  const innerCircle = new Graphics();
  innerCircle.lineStyle(2, 0xffffff);
  innerCircle.drawCircle(0, 0, radius - 50);
  innerCircle.endFill();
  innerCircle.alpha = 0.3;
  timelineContainer.addChild(innerCircle);

  // Timeline
  const timeline = new Graphics();
  const wheelOffset = -90;
  timeline.angle = wheelOffset;
  timelineContainer.addChild(timeline);

  return {
    timeline,
    timelineContainer,
  };
}

function addText(app: Application, name: string) {
  const textContainer = new Container();
  textContainer.y = app.screen.height - byScreenSize({ xs: 60, s: 80, l: 100 });
  textContainer.x = app.screen.width / 2;
  app.stage.addChild(textContainer);

  // Countdown
  const countdownText = new BitmapText(`T + 00:00:00`, {
    fontName: "BlenderPro500",
    align: "center",
    fontSize: byScreenSize({ xs: 22, s: 36, m: 40, l: 44, xl: 48 }),
  });
  countdownText.y = 10;
  countdownText.anchor.set(0.5, 0);
  textContainer.addChild(countdownText);

  const launchNameText = new BitmapText(name.toUpperCase(), {
    fontName: "BlenderPro500",
    align: "center",
    fontSize: byScreenSize({ xs: 12, s: 14, m: 16, l: 18, xl: 20 }),
  });

  launchNameText.y = countdownText.y + countdownText.height;
  launchNameText.anchor.set(0.5, 0);
  launchNameText.alpha = 0.7;
  textContainer.addChild(launchNameText);

  return {
    textContainer,
    countdownText,
  };
}

function addNotification(app: Application) {
  const textOffset = byScreenSize({ xs: 15, s: 20, m: 50, l: 20, xl: 70 });
  const width = byScreenSize({ xs: app.screen.width * 0.54, s: app.screen.width * 0.33 });
  const height = 180;

  const notificationContainer = new Container();
  notificationContainer.width = width;
  notificationContainer.height = height;

  notificationContainer.y = byScreenSize({
    xs: app.screen.height - height - 60 * 3.5,
    l: app.screen.height - height,
  });
  notificationContainer.x = app.screen.width; // Hide by default
  notificationContainer.alpha = 0; // Hide by default
  app.stage.addChild(notificationContainer);

  // Add shadow behind notification
  const shadow = Sprite.from("/images/side-shadow-right.png");
  shadow.width = width;
  shadow.height = height;
  shadow.x = 0;
  notificationContainer.addChild(shadow);

  // Title
  const title = new Text("Text", {
    fill: 0xffffff,
    fontFamily: "Blender Pro",
    fontWeight: "700",
    fontSize: 24,
    align: "right",
  });
  title.name = "title";
  title.y = 10;
  title.x = width - textOffset;
  title.anchor.x = 1;
  notificationContainer.addChild(title);

  // Description
  const description = new Text("Text", {
    fill: 0xffffff,
    fontFamily: "Blender Pro",
    fontWeight: "500",
    fontSize: 16,
    wordWrap: true,
    align: "right",
    wordWrapWidth: width / 2,
  });
  description.name = "description";
  description.y = 10 + title.height + 5;
  description.x = width - textOffset;
  description.anchor.x = 1;
  notificationContainer.addChild(description);

  return notificationContainer;
}

function addGauges(app: Application, stage: 1 | 2) {
  function byStage(stage: 1 | 2, values: number[]) {
    if (stage === 1) {
      return values.reduce((p, c) => p + c, 0);
    } else {
      return values.reduce((p, c) => p - c, app.screen.width);
    }
  }

  // l = horizontal
  // m = vertical
  const horizontalOffset = byScreenSize({ xs: 15, s: 20, m: 50, l: 20, xl: 70 });
  const gaugeRadius = 60;
  const gaugeWidth = gaugeRadius * 2;
  const secondGaugeOffset = byScreenSize({ xs: 10, s: 15, m: 15, l: 20, xl: 20 });
  const gaugesWidth = gaugeWidth * 2 + secondGaugeOffset;

  const container = new Container();
  container.y = app.screen.height - 180;

  // Gauges
  const gauges = new Container();
  const { gauge: speedGauge, onUpdate: onUpdateSpeedGauge } = makeGauge({
    radius: gaugeRadius,
    min: 0,
    max: 30000,
    value: 0,
    unit: "KM/H",
    name: "SPEED",
  });
  gauges.addChild(speedGauge);

  const { gauge: altGauge, onUpdate: onUpdateAltGauge } = makeGauge({
    enterDelayMs: 100,
    radius: gaugeRadius,
    min: 0,
    max: 600,
    value: 0,
    unit: "KM",
    name: "ALTITUDE",
  });
  gauges.addChild(altGauge);

  gauges.y = 20;
  gauges.pivot.x = gaugesWidth / 2;
  gauges.x = byStage(stage, [horizontalOffset, gaugesWidth / 2]);

  // Title
  const title = new BitmapText(`STAGE ${stage} TELEMETRY`, {
    fontName: "BlenderPro700",
    align: "center",
    fontSize: 16,
  });
  title.anchor.x = 0.5;
  title.x = byStage(stage, [horizontalOffset, gaugesWidth / 2]);
  title.transform.position.y = 140;
  title.alpha = 0;
  animate({
    startValue: title,
    endValue: {
      alpha: 1,
      transform: {
        position: {
          y: 120,
        },
      } as any,
    },
    durationMs: 200,
    delayMs: 400,
  });

  // Shadow
  const shadow = Sprite.from(`/images/side-shadow-${stage === 1 ? "left" : "right"}.png`);
  shadow.height = 180;
  shadow.width = byScreenSize({ xs: app.screen.width * 0.54, s: app.screen.width * 0.33 });
  shadow.y = 0;
  shadow.anchor.x = 0.5;
  shadow.x = byStage(stage, [0]);
  shadow.alpha = 0;
  animate({
    startValue: shadow,
    endValue: {
      alpha: 1,
      transform: {
        position: {
          x: byStage(stage, [shadow.width / 2]),
        },
      } as any,
    },
    durationMs: 250,
    delayMs: 0,
  });

  const config = byScreenSize({
    xs: () => {
      shadow.y = -gaugeWidth;
      altGauge.y = -gaugeWidth;
      gauges.pivot.x = gaugeWidth / 2;
      gauges.x = byStage(stage, [horizontalOffset, gaugeWidth / 2]);
      title.x = byStage(stage, [horizontalOffset, gaugeWidth / 2]);
      container.y = app.screen.height - 180 - gaugeWidth * 0.75;
    },
    l: () => {
      altGauge.x = gaugeWidth + secondGaugeOffset;
    },
  });
  config();

  app.stage.addChild(container);
  container.addChild(shadow);
  container.addChild(gauges);
  container.addChild(title);

  return {
    updateSpeed: onUpdateSpeedGauge,
    updateAltitude: onUpdateAltGauge,
  };
}

function setPointsVisibility(
  date: Date,
  timelineEvents: TimelineEvent[],
  radius: number,
  totalMs: number
) {
  timelineEvents.forEach((timelineEvent) => {
    const diffInMinutes = differenceInMinutes(timelineEvent.time, date);
    const { angle } = getPositionOnTimeline(
      radius,
      totalMs,
      differenceInMilliseconds(timelineEvent.time, date)
    );

    const alpha = getTimelineAlpha(angle);

    if (diffInMinutes > 60) {
      timelineEvent.cpContainer.visible = false;
    } else {
      timelineEvent.cpContainer.visible = true;
      timelineEvent.cpContainer.alpha = alpha;
      if (angle <= 0) {
        if (!timelineEvent.passed) {
          const circle = timelineEvent.cpContainer.getChildByName("circle") as Graphics;
          circle.beginFill(0xffffff);
          circle.drawCircle(0, 0, 8 / 3);
          circle.endFill();
          timelineEvent.passed = true;
        }
      }
    }
  });
}

// function setPointsVisibilityV2(
//   date: Date,
//   timelineEvents: TimelineEvent[],
//   radius: number,
//   timeline: Container
// ) {
//   const liftoffTime = timelineEvents[0].time;
//   const indexOfSeco1 = timelineEvents.findIndex((te) => te.title === "SECO-1");
//   const indexOfSeco2 = timelineEvents.findIndex((te) => te.title === "SECO-2");
//   const seco1 = timelineEvents.find((te) => te.title === "SECO-1")!.time;
//   const seco2 = timelineEvents.find((te) => te.title === "SECO-2")!.time;
//   const endTime = timelineEvents[timelineEvents.length - 1].time;

//   let diff = 0;
//   let totalMs = 0;
//   let startTime = liftoffTime;
//   let visibleEvents: TimelineEvent[] = [];

//   // Liftoff -> Seco1
//   // * 1
//   if (date < seco1) {
//     console.log("before seco1");
//     startTime = liftoffTime;
//     totalMs = differenceInMilliseconds(endTime, startTime);
//     visibleEvents = timelineEvents.slice(0, indexOfSeco1 + 1);
//   } else if (date < seco2) {
//     console.log("before seco2");
//     // Seco1 -> Seco2
//     // * 8
//     startTime = seco1;
//     diff = differenceInMilliseconds(startTime, liftoffTime) * 7;
//     totalMs = differenceInMilliseconds(endTime, startTime) * 8;
//     visibleEvents = [...timelineEvents.slice(indexOfSeco1, indexOfSeco2 + 1)];
//   } else {
//     console.log("after seco2");
//     // Seco2 -> End
//     // % 4
//     startTime = seco2;
//     totalMs = differenceInMilliseconds(endTime, startTime) / 4;
//     visibleEvents = timelineEvents.slice(indexOfSeco2);
//   }

//   timelineEvents.forEach((timelineEvent) => {
//     if (visibleEvents.includes(timelineEvent)) {
//       const { angle: angleForCalc } = getPositionOnTimeline(
//         radius,
//         totalMs,
//         differenceInMilliseconds(timelineEvent.time, date) + diff
//       );

//       const { x, y, angle } = getPositionOnTimeline(
//         radius,
//         totalMs,
//         differenceInMilliseconds(timelineEvent.time, startTime) + diff
//       );

//       const alpha = getTimelineAlpha(angleForCalc);
//       timelineEvent.cpContainer.alpha = 1; //alpha;
//       timelineEvent.cpContainer.visible = true;

//       timelineEvent.cpContainer.x = x;
//       timelineEvent.cpContainer.y = y;
//       timelineEvent.cpContainer.angle = angle;

//       // // Position

//       // Fill it
//       if (angleForCalc <= 0) {
//         if (!timelineEvent.passed) {
//           const circle = timelineEvent.cpContainer.getChildByName("circle") as Graphics;
//           circle.beginFill(0xffffff);
//           circle.drawCircle(0, 0, 8 / 3);
//           circle.endFill();
//           timelineEvent.passed = true;
//         }
//       }
//     } else {
//       timelineEvent.cpContainer.visible = false;
//     }
//   });
// }

export class UI {
  radius: number;
  app: Application;
  stages: StageUpdaters = {};
  launch: LaunchWithData<Date>;

  timeline = new Graphics();
  timelineEvents: TimelineEvent[] = [];
  notification = new Container();
  countdownText = new BitmapText("", {
    fontName: "BlenderPro700",
    fontSize: 16,
  });

  totalMs = 0;
  totalSeconds = 0;
  updateUIParameters: ByStage<Parameters<UpdateUI>> = {};
  updateNotificationParameters: Parameters<UpdateNotification> = [null];

  constructor(
    canvas: HTMLCanvasElement,
    radius: number,
    launch: LaunchWithData<Date>,
    windowProperties: WindowProperties
  ) {
    this.radius = radius;
    this.launch = launch;
    this.app = createPIXI(canvas, windowProperties);

    // const resize = () => {
    //   if (doesNeedResize(this.app.renderer, windowProperties)) {
    //     this.app.ticker.remove(resize);

    //     // Reset
    //     this.app.destroy();
    //     this.stages = {};

    //     // Restart
    //     this.radius = Math.max(windowProperties.innerWidth, windowProperties.innerHeight) * 0.5;
    //     this.app = createPIXI(canvas, windowProperties);
    //     this.initialize();
    //     this.updateNotification(...this.updateNotificationParameters);
    //     if (this.updateUIParameters[1]) {
    //       this.updateUI(...this.updateUIParameters[1]);
    //     }
    //     if (this.updateUIParameters[2]) {
    //       this.updateUI(...this.updateUIParameters[2]);
    //     }
    //     this.app.ticker.add(resize);
    //   }
    // };

    // setTimeout(() => {
    //   const newWidth = 2904;
    //   windowProperties = { ...windowProperties, innerWidth: newWidth };
    //   // windowProperties.innerWidth = newWidth;
    //   // this.radius = Math.max(, windowProperties.innerHeight) * 0.5;
    //   // this.app.renderer.resize(2904, windowProperties.innerHeight);
    //   // this.app.destroy();

    //   // Reset
    //   // this.app.destroy();
    //   this.app.stage.removeChildren();
    //   this.app.renderer.resize(2904, windowProperties.innerHeight);
    //   this.stages = {};

    //   // Restart
    //   this.radius = Math.max(newWidth, windowProperties.innerHeight) * 0.5;
    //   // this.app = createPIXI(canvas, windowProperties);
    //   this.initialize();
    //   this.updateNotification(...this.updateNotificationParameters);
    //   if (this.updateUIParameters[1]) {
    //     this.updateUI(...this.updateUIParameters[1]);
    //   }
    //   if (this.updateUIParameters[2]) {
    //     this.updateUI(...this.updateUIParameters[2]);
    //   }
    // }, 5000);

    // Resize logic
    // this.app.ticker.add(resize);
  }

  public resize({ windowProperties }: { windowProperties: WindowProperties }) {
    const { innerWidth, innerHeight } = windowProperties;
    // Reset
    this.app.stage.removeChildren();
    this.app.renderer.resize(innerWidth, innerHeight);
    this.stages = {};

    // Restart
    this.radius = Math.max(innerWidth, innerHeight) * 0.5;
    this.initialize();
    this.updateNotification(...this.updateNotificationParameters);
    if (this.updateUIParameters[1]) {
      this.updateUI(...this.updateUIParameters[1]);
    }
    if (this.updateUIParameters[2]) {
      this.updateUI(...this.updateUIParameters[2]);
    }
  }

  public static async ofElement(
    canvas: HTMLCanvasElement,
    windowProperties: WindowProperties,
    launch: LaunchWithData<Date>
  ) {
    await resourcesPromise;
    return new UI(
      canvas,
      Math.max(windowProperties.innerWidth, windowProperties.innerHeight) * 0.5,
      launch,
      windowProperties
    ).initialize();
  }

  private initialize() {
    const {
      app,
      radius,
      launch: {
        name,
        data: { events, liftoffTime },
      },
    } = this;

    const { timeline, timelineContainer } = addTimeline(app, radius);
    this.timeline = timeline;
    this.totalMs = differenceInMilliseconds(events[events.length - 1].time, liftoffTime);
    this.timelineEvents = addTimelineEvents(
      events,
      this.totalMs,
      radius,
      liftoffTime,
      this.timeline
    );
    setPointsVisibility(events[0].time, this.timelineEvents, radius, this.totalMs);

    this.countdownText = addText(app, name).countdownText;
    this.notification = addNotification(app);

    return this;
  }

  public updateNotification: UpdateNotification = (...parameters) => {
    this.updateNotificationParameters = parameters;

    const [launchNotification] = parameters;
    const { app, notification } = this;

    if (launchNotification) {
      // Title
      (notification.getChildByName("title") as Text).text =
        launchNotification.title.toUpperCase() || "";

      // Description
      (notification.getChildByName("description") as Text).text =
        launchNotification.description.toUpperCase() || "";
    }

    animate({
      startValue: notification,
      endValue: {
        alpha: !launchNotification ? 0.3 : 1,
        transform: {
          position: {
            x: !launchNotification ? app.screen.width : app.screen.width - notification.width,
          } as any,
        } as any,
      },
      durationMs: 200,
      delayMs: 0,
    });
  };

  public updateUI: UpdateUI = (...parameters) => {
    const [{ date, altitude, speed, stage }] = parameters;
    this.updateUIParameters[stage] = parameters;
    const {
      app,
      radius,
      stages,
      totalMs,
      timeline,
      timelineEvents,
      countdownText,
      launch: {
        data: { liftoffTime },
      },
    } = this;

    const msPassed = differenceInMilliseconds(date, liftoffTime);

    const angle = (360 / totalMs) * msPassed;
    timeline.angle = -angle - 90;
    countdownText.text = getCountdown(liftoffTime, date);
    setPointsVisibility(date, timelineEvents, radius, totalMs);

    const gaugesUpdaters = stages[stage] || addGauges(app, stage);
    if (!stages[stage]) {
      stages[stage] = gaugesUpdaters;
    }

    gaugesUpdaters.updateSpeed({ value: speed });
    gaugesUpdaters.updateAltitude({ value: altitude });
  };
}
