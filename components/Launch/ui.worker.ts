import type { Stage } from "./Launch";
import type { LaunchWithData, LaunchNotification } from "../../data/launch";
import { UI, UpdateNotification } from "./UI";

let ui: UI;

interface VisualizationWorkerMessage {
  type: "init" | "updateNotification" | "updateUI" | "resize";
  canvas: HTMLCanvasElement;
  windowProperties: Pick<Window, "innerHeight" | "innerWidth" | "devicePixelRatio">;
  launch: LaunchWithData<Date>;

  // UI Update
  stage: Stage;
  date: Date;
  speed: number;
  altitude: number;

  // Notification
  updateNotification: null | LaunchNotification<Date>;
}

self.onmessage = async (event: MessageEvent<VisualizationWorkerMessage>) => {
  const {
    windowProperties,
    type,
    date,
    stage,
    speed,
    canvas,
    launch,
    altitude,
    updateNotification,
  } = event.data;

  switch (type) {
    case "init":
      ui = await UI.ofElement(canvas, windowProperties, launch);
      break;
    case "updateNotification":
      ui.updateNotification(updateNotification);
      break;
    case "updateUI":
      ui.updateUI({ stage, date, speed, altitude });
      break;
    case "resize":
      ui.resize({ windowProperties });
      break;
    default:
      break;
  }
};

export {};
