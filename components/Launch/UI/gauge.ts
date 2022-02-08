import { toRadians, convertRelativeScale } from "../../utils";

import { Container, Graphics, Sprite, Text } from "pixi.js";

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
  shadow.width = radius * 2 + 10;
  shadow.height = radius * 2 + 10;
  shadow.x = radius;
  shadow.y = radius;
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

  const { gaugeValueText } = addText({
    gauge,
    radius,
    name,
    unit,
    value: String(value),
  });

  return {
    gauge: gaugeContainer,
    onUpdate: ({ value }: { value: string | number }) => {
      gaugeValue.clear();

      gaugeValueText.text = String(value);
      gaugeValueText.x = radius - gaugeValueText.width / 2;
      gaugeValueText.y = radius - gaugeValueText.height / 2;
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
  const mask = createGauge(
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
    4
  );

  const startTick = new Graphics();
  mask.addChild(startTick);

  startTick.beginFill(0xffffff).drawRect(60, 0, -10, 2);
  startTick.x = 60;
  startTick.y = 60;
  startTick.rotation = toRadians(23);

  const endTick = new Graphics();
  mask.addChild(endTick);

  endTick.beginFill(0xff0000).drawRect(60, 0, -10, -2);
  endTick.rotation = toRadians(180 - 23);
  endTick.x = 60;
  endTick.y = 60;

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
  const gaugeValueText = new Text(value, {
    fill: "#ffffff",
    fontSize: 40,
    fontWeight: "500",
    fontFamily: "Blender Pro",
    align: "center",
  });
  gauge.addChild(gaugeValueText);

  gaugeValueText.x = radius - gaugeValueText.width / 2;
  gaugeValueText.y = radius - gaugeValueText.height / 2;

  const gaugeNameText = new Text(name, {
    fill: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Blender Pro",
  });
  gauge.addChild(gaugeNameText);

  gaugeNameText.alpha = 0.7;
  gaugeNameText.x = radius - gaugeNameText.width / 2;
  gaugeNameText.y =
    radius - gaugeNameText.height / 2 - gaugeValueText.height / 2 - 5;

  const gaugeUnitText = new Text(unit, {
    fill: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Blender Pro",
  });
  gauge.addChild(gaugeUnitText);

  gaugeUnitText.alpha = 0.7;
  gaugeUnitText.x = radius - gaugeUnitText.width / 2;
  gaugeUnitText.y =
    radius - gaugeUnitText.height / 2 + gaugeValueText.height / 2 + 7;

  return {
    gauge,
    gaugeUnitText,
    gaugeNameText,
    gaugeValueText,
  };
}
