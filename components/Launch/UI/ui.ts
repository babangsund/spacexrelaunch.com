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
  Application,
  AbstractRenderer,
  BitmapText,
  BitmapFont,
} from "pixi.js";

import { makeGauge } from "./gauge";
import { toRadians } from "../../utils";
import { LaunchNotification, LaunchWithData } from "../../../data/launch";
import { animate } from "./animate";
import { resolve } from "path/posix";

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

export async function makeUI(
  canvas: HTMLCanvasElement,
  { name, data: { events, telemetry, liftoffTime } }: LaunchWithData<Date>
) {
  await fonts;

  const app = createPIXI(canvas);

  /**
   * Timeline
   */
  const radius = app.screen.height * 0.8;

  const timeline = new Container();
  timeline.y = radius;
  app.stage.addChild(timeline);

  const wheelBackgroundLine = new Graphics();
  wheelBackgroundLine.lineStyle(3, 0xffffff);
  wheelBackgroundLine.drawCircle(0, 0, radius);
  wheelBackgroundLine.endFill();
  wheelBackgroundLine.alpha = 0.5;
  wheelBackgroundLine.x = app.screen.width / 2;
  wheelBackgroundLine.y = app.screen.height - 150;
  timeline.addChild(wheelBackgroundLine);

  const foreGround = new Graphics();
  foreGround.lineStyle(3, 0xffffff);
  foreGround.arc(0, 0, radius, toRadians(-180), toRadians(-90));
  foreGround.x = app.screen.width / 2;
  foreGround.y = app.screen.height - 150;
  timeline.addChild(foreGround);

  const wheelCenterTick = new Graphics();
  wheelCenterTick
    .beginFill(0xffffff)
    .drawRect(0, -radius - 4, 2, 8)
    .endFill();
  wheelCenterTick.rotation = toRadians(0);
  foreGround.addChild(wheelCenterTick);

  // Outer gradient shadow
  const outerShadow = Sprite.from("/images/outer-shadow.png");
  outerShadow.anchor.set(0.5);
  outerShadow.width = radius * 2 + 100;
  outerShadow.height = radius * 2 + 100;
  outerShadow.x = app.screen.width / 2;
  outerShadow.y = app.screen.height - 150;
  timeline.addChild(outerShadow);

  // Inner solid shadow
  const innerShadow = new Graphics();
  innerShadow.beginFill(0x000000);
  innerShadow.drawCircle(0, 0, radius - 50);
  innerShadow.endFill();
  innerShadow.alpha = 0.4;
  innerShadow.x = app.screen.width / 2;
  innerShadow.y = app.screen.height - 150;
  timeline.addChild(innerShadow);

  // Inner wheel
  const innerWheel = new Graphics();
  innerWheel.lineStyle(2, 0xffffff);
  innerWheel.drawCircle(0, 0, radius - 50);
  innerWheel.endFill();
  innerWheel.alpha = 0.3;
  innerWheel.x = app.screen.width / 2;
  innerWheel.y = app.screen.height - 150;
  timeline.addChild(innerWheel);

  // Wheel
  const wheel = new Graphics();
  const wheelOffset = -90;
  wheel.angle = wheelOffset;
  wheel.x = app.screen.width / 2;
  wheel.y = app.screen.height - 150;
  wheel.endFill();
  timeline.addChild(wheel);

  const eventsEnd = events[events.length - 1].time;
  const totalSeconds = differenceInSeconds(eventsEnd, liftoffTime);

  const wheelPoints: {
    time: Date;
    title: string;
    passed?: boolean;
    cpContainer: Container;
  }[] = [];

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

    // circle.beginFill(0xffffff);
    // circle.drawCircle(0, 0, circleRadius / 2);
    // circle.endFill();

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
      // fill: "#ffffff",
      // fontWeight: "700",
      // fontFamily: "Blender Pro",
    });

    text.name = "text";

    text.angle = 90;
    text.x = isAbove
      ? lineHeight * 2 + text.height
      : -(lineHeight + text.height / 2);
    text.y = -(text.width / 2);

    cpContainer.addChild(circle, text, line);
    wheel.addChild(cpContainer);
    wheelPoints.push({ cpContainer, time: cp.time, title: cp.title });
    cpContainer.visible = false;
  });

  const textContainer = new Container();

  // Countdown
  const countdown = new BitmapText(`T+ 00:00:00`, {
    fontName: "BlenderPro500",
    fontSize: 48,
    align: "center",
    // fill: "#ffffff",
    // fontWeight: "500",
    // fontFamily: "Blender Pro",
  });

  countdown.y = app.screen.height - 100 + 10;
  countdown.x = app.screen.width / 2 - countdown.width / 2;

  textContainer.addChild(countdown);
  app.stage.addChild(textContainer);

  const launchName = new BitmapText(name.toUpperCase(), {
    fontName: "BlenderPro500",
    fontSize: 20,
    // fill: "#ffffff",
    // fontWeight: "500",
    // fontFamily: "Blender Pro",
  });

  launchName.y = countdown.y + countdown.height;
  launchName.x = app.screen.width / 2 - launchName.width / 2;
  launchName.alpha = 0.7;

  textContainer.addChild(launchName);

  const getAlpha = (angle: number) => {
    if (angle > 180) {
      angle = angle - 360;
    }
    return 1 - Math.abs((angle / 90) * 90) / 25 + 0.25; // 25 and 0.25 are arbitrary values
  };

  const setPointsVisibility = (date: Date) => {
    wheelPoints.forEach((wheelPoint) => {
      const diffInMinutes = differenceInMinutes(wheelPoint.time, date);
      const { angle } = getPositionOnTimeline(
        radius,
        totalSeconds,
        differenceInSeconds(wheelPoint.time, date)
      );

      const alpha = getAlpha(angle);

      if (diffInMinutes > 60) {
        wheelPoint.cpContainer.visible = false;
      } else {
        wheelPoint.cpContainer.visible = true;
        wheelPoint.cpContainer.alpha = alpha;
        if (angle <= 0) {
          if (!wheelPoint.passed) {
            const circle = wheelPoint.cpContainer.getChildByName(
              "circle"
            ) as Graphics;
            circle.beginFill(0xffffff);
            circle.drawCircle(0, 0, 8 / 3);
            circle.endFill();
            wheelPoint.passed = true;
          }
        }
      }
    });
  };

  function startGauges(stage: 1 | 2) {
    const gauges = new Container();

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
      // fill: "#ffffff",
      fontSize: 16,
      // fontWeight: "700",
      // fontFamily: "Blender Pro",
    });
    title.alpha = 0;
    title.y = app.screen.height - 40;
    animate({
      startValue: title,
      endValue: { y: app.screen.height - 60, alpha: 1 },
      durationMs: 200,
      delayMs: 300,
    });

    // Add shadow behind gauges
    const shadow = Sprite.from("/images/side-shadow.png");
    //shadow.anchor.set(0.5);
    shadow.width = app.screen.width / 3;
    shadow.height = 180;
    shadow.x = app.screen.width;
    shadow.y = app.screen.height - 180;

    // Stage 2
    if (stage === 2) {
      shadow.scale.x *= -1; // Mirror
      gauges.x = app.screen.width - gauges.width - 140;
      gauges.y = app.screen.height - 160;

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
      gauges.y = app.screen.height - 160;

      title.x = 60 + title.width / 2;

      shadow.x = 0 - shadow.width;
      animate({
        startValue: shadow,
        endValue: { x: 0 },
        durationMs: 500,
        delayMs: 0,
      });
    }

    app.stage.addChild(shadow);
    app.stage.addChild(gauges);
    app.stage.addChild(title);

    return {
      updateSpeed: onUpdateSpeedGauge,
      updateAltitude: onUpdateAltGauge,
    };
  }

  // Resize logic
  const ticker = Ticker.shared;
  ticker.add(() => {
    if (doesNeedResize(app.renderer)) {
      app.renderer.resize(window.innerWidth, window.innerHeight);
      // TODO: Resize elements on window resize
    }
  });

  const stages: Partial<
    Record<1 | 2, { updateSpeed: Function; updateAltitude: Function }>
  > = {};

  setPointsVisibility(events[0].time);

  function addNotification() {
    const width = app.screen.width / 3;
    const height = 180;

    const notificationContainer = new Container();
    notificationContainer.width = width;
    notificationContainer.height = height;
    app.stage.addChild(notificationContainer);

    // Add shadow behind gauges
    const shadow = Sprite.from("/images/side-shadow.png");
    shadow.width = width;
    shadow.height = height;
    // Mirror
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

    // Content
    const content = new Text("Text", {
      fill: 0xffffff,
      fontFamily: "Blender Pro",
      fontWeight: "500",
      fontSize: 16,
      wordWrap: true,
      align: "right",
      wordWrapWidth: width / 2,
    });
    content.name = "content";
    content.y = 10 + title.height + 5;
    content.x = width - 80;
    notificationContainer.addChild(content);

    notificationContainer.alpha = 0; // Hide by default
    notificationContainer.x = app.screen.width; // Hide by default
    notificationContainer.y = app.screen.height - height;

    return notificationContainer;
  }

  const notification = addNotification();

  const updateNotification = (
    launchNotification: null | LaunchNotification<Date>
  ) => {
    // Title
    (notification.getChildByName("title") as Text).text =
      launchNotification?.title.toUpperCase() || "";
    (notification.getChildByName("title") as Text).x =
      app.screen.width / 3 -
      80 -
      (notification.getChildByName("title") as Text).width;

    // Content
    (notification.getChildByName("content") as Text).text =
      launchNotification?.description.toUpperCase() || "";
    (notification.getChildByName("content") as Text).x =
      app.screen.width / 3 -
      80 -
      (notification.getChildByName("content") as Text).width;

    animate({
      startValue: notification,
      endValue: {
        alpha: !launchNotification ? 0.2 : 1,
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

  const updateUI: UpdateUI = ({
    date,
    secondsPassed,
    altitude,
    speed,
    stage,
  }) => {
    const angle = (360 / totalSeconds) * secondsPassed;
    wheel.angle = -angle - 90;
    countdown.text = getCountdown(liftoffTime, date);
    setPointsVisibility(date);

    const gaugesUpdaters = stages[stage] || startGauges(stage);
    if (!stages[stage]) {
      stages[stage] = gaugesUpdaters;
    }

    const { updateSpeed, updateAltitude } = gaugesUpdaters;

    updateSpeed({ value: speed });
    updateAltitude({ value: altitude });
  };

  return { updateUI, updateNotification };
}
