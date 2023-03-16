import { extent } from "d3-array";
import { ScaleLinear, scaleLinear } from "d3-scale";
import { makeVisual, UpdateVisual, ResizeVisual } from "./visualization";
import type { Stage } from "./Launch";
import type { LaunchData, Position } from "../../data/launch";

let altitudeScale: ScaleLinear<number, number, never>,
  updateVisual: UpdateVisual,
  resize: ResizeVisual;

interface VisualizationWorkerMessage {
  type: "init" | "update" | "resize";
  canvas: HTMLCanvasElement;
  data: LaunchData<Date>;
  windowProperties: Pick<Window, "innerHeight" | "innerWidth" | "devicePixelRatio">;
  stage: Stage;
  altitude: number;
  position: Position;
}

self.onmessage = async (event: MessageEvent<VisualizationWorkerMessage>) => {
  const { type, canvas, data, windowProperties, stage, altitude, position } = event.data;

  // write a case for every type
  switch (type) {
    case "init": {
      altitudeScale = scaleLinear()
        .domain(
          // @ts-ignore
          extent(
            data.telemetry.stage[1].concat(data.telemetry.stage[2]),
            (t: any) => t.altitude
          ) as [number, number]
        )
        .range([0, 5]) as any;

      // @ts-ignore
      [updateVisual, resize] = await makeVisual(
        canvas as HTMLCanvasElement,
        data,
        altitudeScale,
        windowProperties
      );
      break;
    }
    case "update": {
      updateVisual({ stage, altitude, position });
      break;
    }
    case "resize": {
      resize(windowProperties);
      break;
    }
    default:
      break;
  }
};

export {};
