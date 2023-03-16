import { extent } from "d3-array";
import { ScaleLinear, scaleLinear } from "d3-scale";
import { makeVisual, UpdateVisual, ResizeVisual } from "./visualization";
import type { Stage } from "./Launch";
import type { LaunchData, Position } from "../../data/launch";

let altitudeScale: ScaleLinear<number, number, never>,
  updateVisual: UpdateVisual,
  resize: ResizeVisual;

interface VisualizationWorkerMessage {
  type: "vis::init" | "vis::update" | "vis::resize";
  canvas: HTMLCanvasElement;
  data: LaunchData<Date>;
  windowProperties: Pick<Window, "innerHeight" | "innerWidth" | "devicePixelRatio">;
  stage: Stage;
  altitude: number;
  position: Position;
  channel: MessagePort;
}

self.onmessage = async (event: MessageEvent<VisualizationWorkerMessage>) => {
  if (event.data.type === "vis::init") {
    altitudeScale = scaleLinear()
      .domain(
        // @ts-ignore
        extent(
          event.data.data.telemetry.stage[1].concat(event.data.data.telemetry.stage[2]),
          (t: any) => t.altitude
        ) as [number, number]
      )
      .range([0, 5]) as any;

    // @ts-ignore
    [updateVisual, resize] = await makeVisual(
      event.data.canvas as HTMLCanvasElement,
      event.data.data,
      altitudeScale,
      event.data.windowProperties
    );

    event.data.channel.onmessage = (event: MessageEvent<VisualizationWorkerMessage>) => {
      const { type, canvas, data, windowProperties, stage, altitude, position } = event.data;
      // write a case for every type
      switch (type) {
        case "vis::update": {
          updateVisual({ stage, altitude, position });
          break;
        }
        case "vis::resize":
        case "vis::init":
        default:
          break;
      }
    };
  } else if (event.data.type === "vis::resize") {
    resize(event.data.windowProperties);
  }
};

export {};
