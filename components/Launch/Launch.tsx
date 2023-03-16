import React from "react";

import styles from "./Launch.module.css";
import { endPageTransition } from "../transitionPage";
import { LaunchWithData } from "../../data/launch";

interface LaunchProps {
  isPlaying: boolean;
  playbackRate: number;
  launch: LaunchWithData<Date>;
}

export type Stage = 1 | 2;

const Launch = React.memo(function Launch({ launch, isPlaying, playbackRate }: LaunchProps) {
  const { data } = launch;

  const pixiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const visualWorker = React.useRef<Worker | null>(null);
  const uiWorker = React.useRef<Worker | null>(null);
  const simWorker = React.useRef<Worker | null>(null);

  const uiChannel = React.useRef<MessageChannel>(new MessageChannel());
  const visChannel = React.useRef<MessageChannel>(new MessageChannel());

  React.useEffect(() => {
    simWorker.current?.postMessage({
      playbackRate,
      type: "sim::playbackRate",
    });
  }, [playbackRate]);

  React.useEffect(() => {
    simWorker.current?.postMessage({
      launch,
      type: "sim::stop",
    });
    if (isPlaying) {
      simWorker.current?.postMessage({
        launch,
        type: "sim::start",
      });
    }
  }, [isPlaying, launch]);

  React.useEffect(() => {
    return () => {
      simWorker.current?.postMessage({
        type: "sim::stop",
      });
    };
  }, []);

  React.useEffect(() => {
    const resize = () => {
      requestAnimationFrame(() => {
        uiWorker.current?.postMessage({
          type: "ui::resize",
          windowProperties: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
          },
        });
        visualWorker.current?.postMessage({
          type: "vis::resize",
          windowProperties: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
          },
        });
      });
    };

    async function initialize() {
      simWorker.current = new Worker(new URL("./simulation.worker.ts", import.meta.url));
      simWorker.current.postMessage(
        {
          launch,
          playbackRate,
          type: "sim::init",
          uiPort: uiChannel.current.port1,
          visPort: visChannel.current.port1,
        },
        [uiChannel.current.port1, visChannel.current.port1]
      );

      // @ts-ignore
      const offscreen = threeCanvasRef.current.transferControlToOffscreen();
      visualWorker.current = new Worker(new URL("./visualization.worker.ts", import.meta.url));
      visualWorker.current.postMessage(
        {
          type: "vis::init",
          channel: visChannel.current.port2,
          canvas: offscreen,
          data,
          windowProperties: {
            devicePixelRatio: window.devicePixelRatio,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
          },
        },
        [offscreen, visChannel.current.port2]
      );

      // ui.current = await UI.ofElement(pixiCanvasRef.current as HTMLCanvasElement, launch);
      // @ts-ignore
      const offscreenUI = pixiCanvasRef.current.transferControlToOffscreen();
      uiWorker.current = new Worker(new URL("./ui.worker.ts", import.meta.url));
      uiWorker.current.postMessage(
        {
          type: "ui::init",
          channel: uiChannel.current.port2,
          launch,
          canvas: offscreenUI,
          windowProperties: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
          },
        },
        [offscreenUI, uiChannel.current.port2]
      );

      window.addEventListener("resize", resize);

      setTimeout(() => {
        requestAnimationFrame(() => {
          endPageTransition();
        });
      }, 200);
    }

    initialize();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [launch, data]);

  return (
    <>
      <canvas className={styles.canvas} id="threeCanvas" ref={threeCanvasRef} />
      <canvas className={styles.uiCanvas} ref={pixiCanvasRef} />
    </>
  );
});

export default Launch;
