import type { Stage } from "./Launch";
import type { LaunchWithData, LaunchNotification } from "../../data/launch";
import { UI, UpdateNotification } from "./UI";

let ui: UI;

interface VisualizationWorkerMessage {
  type: "ui::init" | "ui::updateNotification" | "ui::update" | "ui::resize";
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

  channel: MessagePort;
}

self.onmessage = async (event: MessageEvent<VisualizationWorkerMessage>) => {
  const { canvas, launch, windowProperties } = event.data;

  if (event.data.type === "ui::init") {
    ui = await UI.ofElement(canvas, windowProperties, launch);

    event.data.channel.onmessage = async (event: MessageEvent<VisualizationWorkerMessage>) => {
      const { type, date, stage, speed, altitude, windowProperties, updateNotification } =
        event.data;

      switch (type) {
        case "ui::updateNotification":
          ui.updateNotification(updateNotification);
          break;
        case "ui::update":
          ui.updateUI({ stage, date, speed, altitude });
          break;
        case "ui::init":
        case "ui::resize":
        default:
          break;
      }
    };
  } else if (event.data.type === "ui::resize") {
    ui.resize({ windowProperties });
  }
};

export {};
