import FontFaceObserver from "fontfaceobserver";
import differenceInSeconds from "date-fns/differenceInSeconds";
import differenceInMinutes from "date-fns/differenceInMinutes";
import {
  Text,
  Ticker,
  Sprite,
  Graphics,
  Renderer,
  Container,
  BitmapText,
  BitmapFont,
  Application,
  AbstractRenderer,
} from "pixi.js";

import { animate } from "./animate";
import { makeGauge } from "./gauge";
import { toRadians } from "../../utils";
import {
  LaunchEvent,
  LaunchNotification,
  LaunchWithData,
} from "../../../data/launch";

interface Updaters {
  updateSpeed: Function;
  updateAltitude: Function;
}

interface StageUpdaters {
  1?: Updaters;
  2?: Updaters;
}

export type UpdateUI = (data: {
  stage: 1 | 2;
  date: Date;
  speed: number;
  secondsPassed: number;
  altitude: number | string;
}) => void;

const font500 = new FontFaceObserver("Blender Pro", {
  weight: 500,
});
const font700 = new FontFaceObserver("Blender Pro", {
  weight: 700,
});

const bitmapCharacters = BitmapFont.ALPHANUMERIC.concat([
  ".",
  "/",
  "+",
  ":",
  "-",
]);

const fonts = Promise.all([
  font500.load(undefined, 30000),
  font700.load(undefined, 30000),
]).then(() => {
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
});

function getTimelineAlpha(angle: number) {
  if (angle > 180) {
    angle = angle - 360;
  }
  return 1 - Math.abs((angle / 90) * 90) / 25 + 0.25; // 25 and 0.25 are arbitrary values
}

function doesNeedResize(renderer: Renderer | AbstractRenderer) {
  const canvas = renderer.view;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const needResize =
    canvas.clientWidth !== width || canvas.clientHeight !== height;

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

  return `T + ${toTwoDigit(hours)}:${toTwoDigit(minutes)}:${toTwoDigit(
    seconds
  )}`;
}

function getPositionOnTimeline(radius: number, total: number, part: number) {
  const angle = (360 / total) * part;

  const radian = angle * (Math.PI / 180);

  const x = radius * Math.cos((2 * Math.PI * part) / total);
  const y = radius * Math.sin((2 * Math.PI * part) / total);

  return { x, y, angle, radian };
}

function createPIXI(view: HTMLCanvasElement) {
  const app = new Application({
    view,
    resizeTo: view,
    backgroundAlpha: 0,
    //antialias: true || window.devicePixelRatio > 1 ? false : true,
    autoDensity: true,
    antialias: true,
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: window.devicePixelRatio || 1,
  });

  return app;
}

interface TimelineEvent {
  time: Date;
  title: string;
  passed?: boolean;
  cpContainer: Container;
}

function addTimelineEvents(
  events: LaunchEvent<Date>[],
  totalSeconds: number,
  radius: number,
  liftoffTime: Date,
  wheel: Graphics
) {
  const wheelEvents: TimelineEvent[] = [];

  events.forEach((cp, index) => {
    const isAbove = index % 2 === 0;

    const { x, y, angle } = getPositionOnTimeline(
      radius,
      totalSeconds,
      differenceInSeconds(cp.time, liftoffTime)
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

    const text = new BitmapText(cp.title, {
      fontName: "BlenderPro700",
      fontSize: 16,
    });

    text.name = "text";

    text.angle = 90;
    text.x = isAbove
      ? lineHeight * 2 + text.height
      : -(lineHeight + text.height / 2);
    text.y = -(text.width / 2);

    cpContainer.addChild(circle, text, line);
    wheel.addChild(cpContainer);
    wheelEvents.push({ cpContainer, time: cp.time, title: cp.title });
    cpContainer.visible = false;
  });

  return wheelEvents;
}

function addTimeline(app: Application, radius: number) {
  const timelineContainer = new Container();
  timelineContainer.x = app.screen.width / 2;
  timelineContainer.y = app.screen.height + radius - 150;
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
  textContainer.y = app.screen.height - 100;
  textContainer.x = app.screen.width / 2;
  app.stage.addChild(textContainer);

  // Countdown
  const countdownText = new BitmapText(`T+ 00:00:00`, {
    fontName: "BlenderPro500",
    align: "center",
    fontSize: 48,
  });
  countdownText.y = 10;
  countdownText.anchor.set(0.5, 0);
  textContainer.addChild(countdownText);

  const launchNameText = new BitmapText(name.toUpperCase(), {
    fontName: "BlenderPro500",
    align: "center",
    fontSize: 20,
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
  const width = app.screen.width / 3;
  const height = 180;

  const notificationContainer = new Container();
  notificationContainer.width = width;
  notificationContainer.height = height;
  notificationContainer.y = app.screen.height - height;
  notificationContainer.x = app.screen.width; // Hide by default
  notificationContainer.alpha = 0; // Hide by default
  app.stage.addChild(notificationContainer);

  // Add shadow behind gauges
  const shadow = Sprite.from("/images/side-shadow.png");
  shadow.width = width;
  shadow.height = height;
  // Mirror the sprite
  shadow.scale.x *= -1;
  shadow.x = shadow.width;
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
  title.x = width - 80;
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
  description.x = width - 80;
  notificationContainer.addChild(description);

  return notificationContainer;
}

function addGauges(app: Application, stage: 1 | 2) {
  const container = new Container();
  container.y = app.screen.height - 180;

  const gauges = new Container();
  gauges.y = 20;

  const { gauge: speedGauge, onUpdate: onUpdateSpeedGauge } = makeGauge({
    radius: 60,
    min: 0,
    max: 30000,
    value: 0,
    unit: "KM/H",
    name: "SPEED",
  });
  gauges.addChild(speedGauge);

  const { gauge: altGauge, onUpdate: onUpdateAltGauge } = makeGauge({
    radius: 60,
    min: 0,
    max: 600,
    value: 0,
    unit: "KM",
    name: "ALTITUDE",
  });
  altGauge.x = 140;
  gauges.addChild(altGauge);

  const title = new BitmapText(`STAGE ${stage} TELEMETRY`, {
    fontName: "BlenderPro700",
    align: "center",
    fontSize: 16,
  });
  title.alpha = 0;
  title.y = 140;
  animate({
    startValue: title,
    endValue: { y: 120, alpha: 1 },
    durationMs: 200,
    delayMs: 300,
  });

  // Add shadow behind gauges
  const shadow = Sprite.from("/images/side-shadow.png");
  //shadow.anchor.set(0.5);
  shadow.width = app.screen.width / 3;
  shadow.height = 180;
  shadow.x = app.screen.width;
  shadow.y = 0;

  // Stage 2
  if (stage === 2) {
    shadow.scale.x *= -1; // Mirror
    gauges.x = app.screen.width - gauges.width - 140;
    title.x = app.screen.width - title.width - 130;
    shadow.x = app.screen.width + shadow.width;
    animate({
      startValue: shadow,
      endValue: { x: app.screen.width },
      durationMs: 500,
      delayMs: 0,
    });
  }
  // Stage 1
  else {
    shadow.x = 0;
    gauges.x = 70;
    title.x = 60 + title.width / 2;
    shadow.x = -shadow.width;
    animate({
      startValue: shadow,
      endValue: { x: 0 },
      durationMs: 500,
      delayMs: 0,
    });
  }

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
  totalSeconds: number
) {
  timelineEvents.forEach((timelineEvent) => {
    const diffInMinutes = differenceInMinutes(timelineEvent.time, date);
    const { angle } = getPositionOnTimeline(
      radius,
      totalSeconds,
      differenceInSeconds(timelineEvent.time, date)
    );

    const alpha = getTimelineAlpha(angle);

    if (diffInMinutes > 60) {
      timelineEvent.cpContainer.visible = false;
    } else {
      timelineEvent.cpContainer.visible = true;
      timelineEvent.cpContainer.alpha = alpha;
      if (angle <= 0) {
        if (!timelineEvent.passed) {
          const circle = timelineEvent.cpContainer.getChildByName(
            "circle"
          ) as Graphics;
          circle.beginFill(0xffffff);
          circle.drawCircle(0, 0, 8 / 3);
          circle.endFill();
          timelineEvent.passed = true;
        }
      }
    }
  });
}

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

  totalSeconds = 0;
  activeLaunchNotification: null | LaunchNotification<Date> = null;
  latestUIState: {
    stage: 1 | 2;
    date: Date;
    speed: number;
    secondsPassed: number;
    altitude: number | string;
  } | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    radius: number,
    launch: LaunchWithData<Date>
  ) {
    this.radius = radius;
    this.launch = launch;
    this.app = createPIXI(canvas);

    // Resize logic
    const ticker = Ticker.shared;
    ticker.add(() => {
      if (doesNeedResize(this.app.renderer)) {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);

        this.app.destroy();
        this.stages = {};
        this.app = createPIXI(canvas);
        requestAnimationFrame(() => {
          this.initialize();
          this.updateNotification(this.activeLaunchNotification);
          if (this.latestUIState) this.updateUI(this.latestUIState);
        });
      }
    });
  }

  public static async ofElement(
    canvas: HTMLCanvasElement,
    radius: number,
    launch: LaunchWithData<Date>
  ) {
    await fonts;
    return new UI(canvas, radius, launch).initialize();
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

    this.timeline = addTimeline(app, radius).timeline;

    this.totalSeconds = differenceInSeconds(
      events[events.length - 1].time,
      liftoffTime
    );

    this.timelineEvents = addTimelineEvents(
      events,
      this.totalSeconds,
      radius,
      liftoffTime,
      this.timeline
    );

    this.countdownText = addText(app, name).countdownText;

    setPointsVisibility(
      events[0].time,
      this.timelineEvents,
      radius,
      this.totalSeconds
    );

    this.notification = addNotification(app);

    return this;
  }

  public updateNotification = (
    launchNotification: null | LaunchNotification<Date>
  ) => {
    this.activeLaunchNotification = launchNotification;

    const { app, notification } = this;

    // Title
    if (launchNotification) {
      (notification.getChildByName("title") as Text).text =
        launchNotification?.title.toUpperCase() || "";
      (notification.getChildByName("title") as Text).x =
        app.screen.width / 3 -
        80 -
        (notification.getChildByName("title") as Text).width;

      // Description
      (notification.getChildByName("description") as Text).text =
        launchNotification?.description.toUpperCase() || "";
      (notification.getChildByName("description") as Text).x =
        app.screen.width / 3 -
        80 -
        (notification.getChildByName("description") as Text).width;
    }

    animate({
      startValue: notification,
      endValue: {
        alpha: !launchNotification ? 0.3 : 1,
        transform: {
          position: {
            x: !launchNotification
              ? app.screen.width
              : app.screen.width - notification.width,
          } as any,
        } as any,
      },
      durationMs: 200,
      delayMs: 0,
    });
  };

  public updateUI: UpdateUI = ({
    date,
    secondsPassed,
    altitude,
    speed,
    stage,
  }) => {
    this.latestUIState = { date, secondsPassed, altitude, speed, stage };
    const {
      app,
      radius,
      stages,
      totalSeconds,
      timeline,
      timelineEvents,
      countdownText,
      launch: {
        data: { liftoffTime },
      },
    } = this;

    const angle = (360 / totalSeconds) * secondsPassed;
    timeline.angle = -angle - 90;
    countdownText.text = getCountdown(liftoffTime, date);
    setPointsVisibility(date, timelineEvents, radius, totalSeconds);

    const gaugesUpdaters = stages[stage] || addGauges(app, stage);
    if (!stages[stage]) {
      stages[stage] = gaugesUpdaters;
    }

    gaugesUpdaters.updateSpeed({ value: speed });
    gaugesUpdaters.updateAltitude({ value: altitude });
  };
}
