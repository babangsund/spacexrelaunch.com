import { Sprite, Graphics, Container, BitmapText } from "pixi.js";

import { animate } from "./animate";
import { toRadians, convertRelativeScale } from "../../utils";

interface MakeGauge {
  min: number;
  max: number;
  name: string;
  unit: string;
  value: number;
  radius: number;
}

export function makeGauge({ radius, name, unit, min, max, value }: MakeGauge) {
  const gaugeContainer = new Container();

  const shadow = Sprite.from("/images/gauge-shadow.png");

  shadow.anchor.set(0.5);
  shadow.x = radius;
  shadow.y = radius;
  shadow.width = radius * 2 + 10;
  shadow.height = radius * 2 + 10;
  gaugeContainer.addChild(shadow);

  const gauge = new Container();
  const gaugeMeter = new Container();
  gauge.addChild(gaugeMeter);

  gaugeContainer.addChild(gauge);

  const mask = createMask(radius);
  gaugeMeter.mask = mask;
  gauge.addChild(mask);

  // Base
  const baseGauge = createGauge(
    undefined,
    radius,
    [
      {
        startAngle: toRadians(180 - 25),
        endAngle: toRadians(-25),
        color: 0xffffff,
      },
      {
        startAngle: toRadians(-25),
        endAngle: toRadians(25),
        color: 0xff0000,
      },
    ],
    10
  );
  baseGauge.alpha = 0.5;
  gaugeMeter.addChild(baseGauge);

  function getSections(value: number) {
    // Value
    const valueInDegrees = convertRelativeScale(
      value,
      [min, max],
      [-180 + -25, 25]
    );

    const sections = [
      {
        startAngle: toRadians(180 - 25),
        endAngle: toRadians(Math.min(valueInDegrees, -25)),
        color: 0xffffff,
      },
    ];

    // Split into two sections
    if (valueInDegrees > -25) {
      sections.push({
        startAngle: toRadians(-25),
        endAngle: toRadians(valueInDegrees),
        color: 0xff0000,
      });
    }
    return sections;
  }

  const gaugeValue = createGauge(undefined, radius, getSections(value), 10);
  gaugeMeter.addChild(gaugeValue);

  const { gaugeValueText, gaugeNameText, gaugeUnitText } = addText({
    gauge,
    radius,
    name,
    unit,
    value: String(value),
  });

  // Enter gauge animation
  // 1. Blow up shadow from center
  // 2. Slide in name and unit from top and bottom
  // 3. Fade in value
  // 4. Draw arc from left to right
  // 5. Enter Stage N telemetry text

  // 1
  const scaleTo = { x: shadow.transform.scale.x, y: shadow.transform.scale.y };
  shadow.transform.scale.set(0, 0);
  animate({
    startValue: shadow.transform.scale,
    endValue: scaleTo,
    durationMs: 500,
    delayMs: 0,
  });

  // 2
  gaugeNameText.alpha = 0;
  gaugeNameText.transform.position.y -= 20;
  animate({
    startValue: gaugeNameText,
    endValue: {
      alpha: 1,
      transform: {
        position: { y: gaugeNameText.transform.position.y + 20 },
      } as any,
    },
    durationMs: 500,
    delayMs: 20,
  });

  // 2
  gaugeUnitText.alpha = 0;
  gaugeUnitText.transform.position.y += 20;
  animate({
    startValue: gaugeUnitText,
    endValue: {
      alpha: 1,
      transform: {
        position: { y: gaugeUnitText.transform.position.y - 20 },
      },
    } as any,
    durationMs: 500,
    delayMs: 20,
  });

  // 3
  gaugeValueText.alpha = 0;
  animate({
    startValue: gaugeValueText,
    endValue: { alpha: 1 },
    durationMs: 500,
    delayMs: 30,
  });

  return {
    gauge: gaugeContainer,
    onUpdate: ({ value }: { value: string | number }) => {
      gaugeValue.clear();

      gaugeValueText.text = String(value);
      createGauge(gaugeValue, radius, getSections(Number(value)), 10);
    },
  };
}

interface Step {
  startAngle: number;
  endAngle: number;
  color: number;
}

// Gauges
function createGauge(
  gauge = new Graphics(),
  radius: number,
  steps: Step[],
  width = 4
) {
  steps.forEach(({ startAngle, endAngle, color }) => {
    gauge.lineStyle(width, color, 1, 0);
    gauge.arc(radius, radius, radius, startAngle, endAngle);
  });
  gauge.endFill();

  return gauge;
}

function createMask(radius: number) {
  const mask = new Graphics();

  animate({
    startValue: { angle: toRadians(180 - 25) },
    endValue: { angle: toRadians(360 + 25) },
    durationMs: 500,
    delayMs: 50,
    onUpdate: ({ angle }) => {
      mask.clear();
      mask.lineStyle(4, 0xffffff, 1, 0);
      mask.arc(radius, radius, radius, toRadians(180 - 25), angle);
      mask.endFill();
    },
    onStart: () => {
      const startTick = new Graphics();
      mask.addChild(startTick);

      startTick.beginFill(0xffffff).drawRect(60, 0, -10, 2);
      startTick.x = 60;
      startTick.y = 60;
      startTick.rotation = toRadians(23);
    },
    onComplete: () => {
      const endTick = new Graphics();
      mask.addChild(endTick);

      endTick.beginFill(0xff0000).drawRect(60, 0, -10, -2);
      endTick.rotation = toRadians(180 - 23);
      endTick.x = 60;
      endTick.y = 60;
    },
  });

  return mask;
}

interface AddText {
  gauge: Container;
  radius: number;
  name: string;
  unit: string;
  value: string;
}

function addText({ gauge, radius, name, unit, value }: AddText) {
  // Gauge text
  const gaugeValueText = new BitmapText(value, {
    fontName: "BlenderPro500",
    align: "center",
    fontSize: 40,
  });
  gauge.addChild(gaugeValueText);

  gaugeValueText.anchor.x = 0.5;
  gaugeValueText.anchor.y = 0.5;
  gaugeValueText.x = radius;
  gaugeValueText.y = radius;

  const gaugeNameText = new BitmapText(name, {
    fontName: "BlenderPro500",
    //fill: "#ffffff",
    fontSize: 14,
    align: "center",
    //fontWeight: "500",
    //fontFamily: "Blender Pro",
  });
  gauge.addChild(gaugeNameText);

  gaugeNameText.anchor.x = 0.5;
  gaugeNameText.anchor.y = 0.5;
  gaugeNameText.alpha = 0.7;
  gaugeNameText.x = radius;
  gaugeNameText.y = radius - gaugeValueText.height / 2 - 5;

  const gaugeUnitText = new BitmapText(unit, {
    fontName: "BlenderPro500",
    fontSize: 14,
    // fill: "#ffffff",
    // fontSize: 14,
    // fontWeight: "500",
    // fontFamily: "Blender Pro",
  });
  gauge.addChild(gaugeUnitText);

  gaugeUnitText.anchor.x = 0.5;
  gaugeUnitText.anchor.y = 0.5;
  gaugeUnitText.alpha = 0.7;
  gaugeUnitText.x = radius;
  gaugeUnitText.y = radius + gaugeValueText.height / 2 + 5;

  return {
    gauge,
    gaugeUnitText,
    gaugeNameText,
    gaugeValueText,
  };
}
