import React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import type { NextPage } from "next";
import parseISO from "date-fns/parseISO";

import {
  getLaunch,
  getLaunches,
  LaunchData,
  LaunchWithData,
} from "../data/launch";
import Header from "../components/Header/Header";
import SoundBars from "../components/SoundBars/SoundBars";

import Play from "../components/Play/PlayPause";
import { useMusic } from "../components/useMusic";
import styles from "../styles/LaunchPage.module.css";
import PlaybackRate, {
  usePlaybackRate,
} from "../components/PlaybackRate/PlaybackRate";

interface LaunchPageProps {
  launch: LaunchWithData<string>;
}

interface LaunchPageParams {
  params: {
    launchName: string;
  };
}

const LaunchNoSSR = dynamic(() => import("../components/Launch/Launch"), {
  ssr: false,
});

const LaunchNoSSRNoop = dynamic(
  () =>
    import("../components/Launch/Launch").then((r) => (() => <div />) as any),
  {
    ssr: false,
  }
);

export async function getStaticPaths() {
  return {
    paths: getLaunches().map((launch) => {
      return {
        params: {
          launchName: `${launch.name}`,
        },
      };
    }),
    fallback: false,
  };
}

export async function getStaticProps({ params }: LaunchPageParams) {
  const launch = getLaunch(params.launchName);
  return {
    props: {
      launch: launch,
    },
  };
}

function parseLaunchData(data: LaunchData<string>): LaunchData<Date> {
  return {
    liftoffTime: parseISO(data.liftoffTime),
    events: data.events.map((e) => ({ ...e, time: parseISO(e.time) })),
    telemetry: data.telemetry.map((t) => ({ ...t, time: parseISO(t.time) })),
  };
}

export const PreloadLinks = (
  // Assets need to be fetched with anonymous crossorigin because the threejs module will execute the subsequent fetch
  <>
    <link
      as="font"
      rel="preload"
      type="font/woff2"
      crossOrigin="anonymous"
      href="/fonts/BlenderPro/BlenderPro-Medium.woff2"
    />
    <link
      as="font"
      rel="preload"
      type="font/woff2"
      crossOrigin="anonymous"
      href="/fonts/BlenderPro/BlenderPro-Bold.woff2"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/skybox-stars-dark/nx.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/skybox-stars-dark/ny.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/skybox-stars-dark/nz.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/skybox-stars-dark/px.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/skybox-stars-dark/py.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/skybox-stars-dark/pz.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/earth-spacex.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/stage-1.png"
    />
    <link
      crossOrigin="anonymous"
      rel="preload"
      as="image"
      href="/images/stage-2.png"
    />
    <LaunchNoSSRNoop />
  </>
);

const LaunchPage: NextPage<LaunchPageProps> = ({ launch }) => {
  const launchData = React.useMemo(
    () => ({ ...launch, data: parseLaunchData(launch.data) }),
    [launch]
  );

  const [isMusicPlaying, toggleIsMusicPlaying] = useMusic();
  const [playbackRate, togglePlaybackRate] = usePlaybackRate();
  const [isLaunchPlaying, setIsLaunchPlaying] = React.useState(false);

  const [isLaunching, setIsLaunching] = React.useState(false);
  const [hasLaunched, setHasLaunched] = React.useState(false);

  const toggleLaunch = React.useCallback(() => {
    if (hasLaunched) {
      setIsLaunchPlaying((p) => !p);
    } else {
      toggleIsMusicPlaying();
      requestAnimationFrame(() => {
        setIsLaunching(true);
      });

      setTimeout(() => {
        requestAnimationFrame(() => {
          setHasLaunched(true);
          setIsLaunchPlaying((p) => !p);
        });
      }, 500);
    }
  }, [hasLaunched, toggleIsMusicPlaying]);

  return (
    <>
      <Head>
        <title>{launch.name} Relaunch</title>
        <meta
          name="description"
          content={`Launched SpaceX Mission ${launch.name}`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <style global jsx>{`
        * {
          font-family: Blender Pro, Helvetica, Arial, sans-serif;
        }
      `}</style>

      <Header />

      <div
        className={`${styles.controls} ${!isLaunching ? styles.hidden : ""}`}
      >
        <SoundBars isPlaying={isMusicPlaying} onToggle={toggleIsMusicPlaying} />
        <Play
          isPlaying={isLaunchPlaying}
          onChange={() => setIsLaunchPlaying((p) => !p)}
        />
        <PlaybackRate rate={playbackRate} onChange={togglePlaybackRate} />
      </div>

      {!hasLaunched && (
        <div className={`${styles.enter} ${isLaunching ? styles.hidden : ""}`}>
          <Play
            className={styles.start}
            isPlaying={isLaunchPlaying}
            onChange={() => toggleLaunch()}
          />
        </div>
      )}

      <main>
        <LaunchNoSSR
          launch={launchData}
          isPlaying={isLaunchPlaying}
          playbackRate={playbackRate}
        />
      </main>
    </>
  );
};

export default LaunchPage;
