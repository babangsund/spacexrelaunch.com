import React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { getLaunches, LaunchSummary } from "../data/launch";

import { PreloadLinks } from "./[launchName]";
import Social from "../components/Social/Social";
import Header from "../components/Header/Header";
import { useMounted } from "../components/utils";
import styles from "../styles/IndexPage.module.css";
import { TransitionValue } from "../components/TransitionValue";
import {
  endPageTransition,
  startPageTransition,
} from "../components/transitionPage";
import Meta from "../components/Meta/Meta";
import {
  byScreenSize,
  ScreenSize,
  useResizeObserver,
  useScreenSize,
} from "../components/screenSize";

export async function getStaticProps() {
  const launches = getLaunches();
  return {
    props: {
      launches,
    },
  };
}

interface IndexPageProps {
  launches: LaunchSummary[];
}

interface DateTimeProps {
  dateTime: string;
  timeZone: string;
}

function DisplayTime({ dateTime, timeZone }: DateTimeProps) {
  const resolvedOptions = Intl.DateTimeFormat().resolvedOptions();
  const timeString = new Date(dateTime).toLocaleTimeString(
    resolvedOptions.locale,
    {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }
  );

  return <TransitionValue padNumber={2} value={timeString} />;
}

function DisplayDate({ dateTime, timeZone }: DateTimeProps) {
  const resolvedOptions = Intl.DateTimeFormat().resolvedOptions();
  const dateString = new Date(dateTime).toLocaleDateString(
    resolvedOptions.locale,
    {
      timeZone,
      dateStyle: "short",
    }
  );

  return <TransitionValue value={dateString} />;
}

function rotateStat(angle: number, screenSize: ScreenSize) {
  const translate = byScreenSize({
    screenSize,
    xs: "100px",
    s: "15vh",
    l: "30vh",
  });
  // 1440+: 30vh
  // 768: 18vh
  return {
    transform: `rotate(${angle}deg) translate(${translate}) rotate(-${angle}deg)`,
  };
}

function rotateLaunch(angle: number, screenSize: ScreenSize) {
  const translate = byScreenSize({
    screenSize,
    xs: "21vh",
    s: "33vh",
    l: "45vh",
  });
  // 1440+: 45vh
  // 768: 32vh
  return {
    transform: `rotate(${angle}deg) translate(${translate}) rotate(180deg)`,
  };
}

function rotateDot(angle: number, screenSize: ScreenSize) {
  const translate = byScreenSize({
    screenSize,
    // Half of inner
    xs: "12.5vh",
    s: "22.5vh",
    l: "32.5vh",
  });
  // 1440+: 32.5vh
  // 768: 22.5vh
  return {
    transform: `rotate(${angle}deg) translate(${translate})`,
  };
}

interface RenderHeadProps {
  launch: LaunchSummary;
}

function RenderHead({ launch }: RenderHeadProps) {
  return (
    <Head>
      <Meta />
      <title>Relaunch {launch.name}</title>
      <meta name="description" content="Relaunch SpaceX missions on-demand" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="preload" as="image" href="/images/stars.png" />
      <link
        as="font"
        rel="preload"
        type="font/woff2"
        crossOrigin="anonymous"
        href="/fonts/D-DIN/D-DIN.woff2"
      />
      <link
        as="font"
        rel="preload"
        type="font/woff2"
        crossOrigin="anonymous"
        href="/fonts/D-DIN/D-DIN-Bold.woff2"
      />
      <link
        as="image"
        rel="preload"
        href="/images/x.svg"
        type="image/svg+xml"
      />
      <link
        as="image"
        rel="preload"
        type="image/svg+xml"
        href="/images/outline.svg"
      />
      <link
        as="image"
        rel="preload"
        type="image/svg+xml"
        href="/images/outline-outer.svg"
      />
    </Head>
  );
}

interface StatProps {
  angle: number;
  name: React.ReactNode;
  unit: React.ReactNode;
  value: React.ReactNode;
  screenSize: ScreenSize;
}

export function Stat({ angle, name, unit, value, screenSize }: StatProps) {
  return (
    <li style={rotateStat(angle, screenSize)} className={styles.stat}>
      <h2>{value}</h2>
      <p>{name}</p>
      <small>{unit}</small>
    </li>
  );
}

interface StatsProps {
  screenSize: ScreenSize;
  launchSummary: LaunchSummary;
}

function Stats({ screenSize, launchSummary }: StatsProps) {
  return (
    <ul className={styles.stats}>
      <Stat
        screenSize={screenSize}
        name="Liftoff"
        angle={(90 / 4) * 0}
        value={
          <DisplayTime
            dateTime={launchSummary.stats.liftoff}
            timeZone={launchSummary.stats.timeZone}
          />
        }
        unit={
          <DisplayDate
            dateTime={launchSummary.stats.liftoff}
            timeZone={launchSummary.stats.timeZone}
          />
        }
      />
      <Stat
        screenSize={screenSize}
        unit=""
        name="Site"
        angle={(90 / 4) * 1}
        value={<TransitionValue value={launchSummary.stats.site} />}
      />
      <Stat
        screenSize={screenSize}
        unit="KM/H"
        name="Speed"
        angle={(90 / 4) * 2}
        value={<TransitionValue value={launchSummary.stats.speed.toString()} />}
      />
      <Stat
        screenSize={screenSize}
        unit="KM"
        name="Altitude"
        angle={(95 / 4) * 3}
        value={
          <TransitionValue value={launchSummary.stats.altitude.toString()} />
        }
      />
    </ul>
  );
}

const IndexPage: NextPage<IndexPageProps> = ({ launches }) => {
  const [{ selectedIndex, selectedLaunch }, setLaunch] = React.useState({
    selectedIndex: 0,
    selectedLaunch: launches[0],
  });

  const router = useRouter();
  const mounted = useMounted();

  const [ref, screenSize] = useScreenSize();

  React.useEffect(() => {
    endPageTransition();
  }, []);

  return (
    <>
      <RenderHead launch={selectedLaunch} />

      <Header />

      <main className={styles.main} ref={ref}>
        <section className={styles.container}>
          <div className={styles.images}>
            <img
              alt="Inner ring"
              aria-hidden="true"
              className={styles.inner}
              src="/images/outline.svg"
            />
            <img
              alt="Outer ring"
              aria-hidden="true"
              className={styles.outer}
              src="/images/outline-outer.svg"
            />
            <div
              role="img"
              className={styles.background}
              aria-label={`Image of ${selectedLaunch.name} launch`}
              style={{ backgroundImage: `url(${selectedLaunch.img})` }}
            />
            <div className={styles.shadow} aria-hidden="true" />
            <hr className={styles.hr} aria-hidden="true" />
          </div>

          <Stats screenSize={screenSize} launchSummary={selectedLaunch} />

          <div className={styles.dotContainer} aria-hidden="true">
            <div
              className={styles.dot}
              style={rotateDot(
                180 + (75 / launches.length) * selectedIndex + 1.5,
                screenSize
              )}
            />
          </div>

          <ul className={styles.launches} role="listbox">
            {launches.map((launch, i) => {
              const isSelected = launch === selectedLaunch;
              return (
                <li
                  role="option"
                  key={launch.name}
                  aria-label={launch.name}
                  className={styles.launch}
                  data-selected={isSelected}
                  aria-selected={isSelected}
                  onClick={() => {
                    setLaunch({
                      selectedIndex: i,
                      selectedLaunch: launch,
                    });
                  }}
                  style={rotateLaunch(
                    180 + (75 / launches.length) * i,
                    screenSize
                  )}
                >
                  {launch.name}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className={styles.button}
            aria-label={`Launch ${selectedLaunch.name}`}
            onClick={async () => {
              await startPageTransition();
              setTimeout(() => {
                router.push("/" + selectedLaunch.name);
              }, 150);
            }}
          >
            LAUNCH
          </button>

          {/* Preload assets */}
          {mounted && PreloadLinks}
          <Link href={"/" + selectedLaunch.name} aria-hidden="true">
            {" "}
          </Link>
        </section>
      </main>

      <Social />
    </>
  );
};

export default IndexPage;
