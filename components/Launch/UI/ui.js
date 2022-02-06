import FontFaceObserver from "fontfaceobserver";
import differenceInSeconds from "date-fns/differenceInSeconds";
import differenceInMinutes from "date-fns/differenceInMinutes";

import { makeGauge } from "./gauge";
import { toRadians } from "../../utils";
import { Application, Container, Graphics, Text, Ticker } from "pixi.js";

const font500 = new FontFaceObserver("Blender Pro", {
  weight: 500,
});
const font700 = new FontFaceObserver("Blender Pro", {
  weight: 700,
});

const fonts = Promise.all([font500.load(), font700.load()]);

function doesNeedResize(renderer) {
  const canvas = renderer.domElement || renderer.view;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const needResize =
    canvas.clientWidth !== width || canvas.clientHeight !== height;

  return needResize;
}

const toTwoDigit = (n) => (n < 10 ? "0".concat(String(n)) : String(n));

function getCountdown(startDate, endDate) {
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

function getPositionOnTimeline(radius, total, part) {
  const angle = (360 / total) * part;

  const radian = angle * (Math.PI / 180);

  const x = radius * Math.cos((2 * Math.PI * part) / total);
  const y = radius * Math.sin((2 * Math.PI * part) / total);

  return { x, y, angle, radian };
}

function createPIXI(view) {
  const app = new Application({
    resizeTo: view,
    view,
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

export async function makeUI(canvas, { events, telemetry, liftoffTime }) {
  await fonts;

  const app = createPIXI(canvas);

  /**
   * Timeline
   */
  // const radius = app.screen.height / 2 + 500;
  const radius = app.screen.height;

  const timeline = new Container();
  timeline.y = radius;
  app.stage.addChild(timeline);

  const background = new Graphics();
  background.lineStyle(3, 0xffffff);
  background.drawCircle(0, 0, radius);
  background.endFill();
  background.alpha = 0.5;
  background.x = app.screen.width / 2;
  background.y = app.screen.height - 150;
  timeline.addChild(background);

  const foreGround = new Graphics();
  foreGround.lineStyle(3, 0xffffff);
  foreGround.arc(0, 0, radius, toRadians(-180), toRadians(-90));
  foreGround.x = app.screen.width / 2;
  foreGround.y = app.screen.height - 150;

  const startTick = new Graphics();
  foreGround.addChild(startTick);

  startTick
    .beginFill(0xffffff)
    .drawRect(0, -radius - 4, 2, 8)
    .endFill();
  startTick.rotation = toRadians(0);

  timeline.addChild(foreGround);

  const wheel = new Graphics();
  const wheelOffset = -90;
  wheel.angle = wheelOffset;
  wheel.x = app.screen.width / 2;
  wheel.y = app.screen.height - 150;
  wheel.endFill();
  timeline.addChild(wheel);

  const eventsEnd = events[events.length - 1].time;

  const totalSeconds = differenceInSeconds(eventsEnd, liftoffTime);

  const wheelPoints = [];

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

    const text = new Text(cp.title, {
      fill: "#ffffff",
      fontSize: 16,
      fontWeight: 700,
      fontFamily: "Blender Pro",
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

  // Countdown
  const countdown = new Text(`T+ 00:00:00`, {
    fill: "#ffffff",
    fontSize: 48,
    fontWeight: 500,
    fontFamily: "Blender Pro",
  });

  countdown.y = -100;
  countdown.x = app.screen.width / 2 - countdown.width / 2;

  timeline.addChild(countdown);

  const launchName = new Text(`TRANSPORTER 3`, {
    fill: "#ffffff",
    fontSize: 20,
    fontWeight: 500,
    fontFamily: "Blender Pro",
  });

  launchName.y = countdown.y + countdown.height;
  launchName.x = app.screen.width / 2 - launchName.width / 2;
  launchName.alpha = 0.7;

  timeline.addChild(launchName);

  const getAlpha = (angle) => {
    if (angle > 180) {
      angle = angle - 360;
    }
    return 1 - Math.abs((angle / 90) * 90) / 25 + 0.25; // 25 and 0.25 are arbitrary values
  };

  const setPointsVisibility = (date) => {
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
            const circle = wheelPoint.cpContainer.getChildByName("circle");
            circle.beginFill(0xffffff);
            circle.drawCircle(0, 0, 8 / 3);
            circle.endFill();
            wheelPoint.passed = true;
          }
        }
      }
    });
  };

  setPointsVisibility(events[0].time);

  const gauges = new Container();
  app.stage.addChild(gauges);

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

  gauges.x = app.screen.width - gauges.width - 80;
  gauges.y = app.screen.height - 150;

  // Resize logic

  const ticker = Ticker.shared;
  ticker.add(() => {
    if (doesNeedResize(app.renderer, window.innerWidth, window.innerHeight)) {
      app.renderer.resize(window.innerWidth, window.innerHeight);
      // TODO: Resize elements on window resize
    }
  });

  return ({ date, secondsPassed, altitude, speed }) => {
    const angle = (360 / totalSeconds) * secondsPassed;
    wheel.angle = -angle - 90;
    countdown.text = getCountdown(liftoffTime, date);
    setPointsVisibility(date);
    onUpdateSpeedGauge({ value: speed });
    onUpdateAltGauge({ value: altitude });
  };
}
