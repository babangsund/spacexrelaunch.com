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

function createRotationStyle(angle: number) {
  return {
    transform: `rotate(${angle}deg) translate(30vh) rotate(-${angle}deg)`,
  };
}

interface StatProps {
  angle: number;
  name: React.ReactNode;
  unit: React.ReactNode;
  value: React.ReactNode;
}

export function Stat({ angle, name, unit, value }: StatProps) {
  return (
    <div style={createRotationStyle(angle)}>
      <h2>{value}</h2>
      <p>{name}</p>
      <small>{unit}</small>
    </div>
  );
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

interface StatsProps {
  launchSummary: LaunchSummary;
}

function Stats({ launchSummary }: StatsProps) {
  return (
    <div className={styles.stats}>
      <Stat
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
        unit=""
        name="Site"
        angle={(90 / 4) * 1}
        value={<TransitionValue value={launchSummary.stats.site} />}
      />
      <Stat
        unit="KM/H"
        name="Speed"
        angle={(90 / 4) * 2}
        value={<TransitionValue value={launchSummary.stats.speed.toString()} />}
      />
      <Stat
        unit="KM"
        name="Altitude"
        angle={(90 / 4) * 3}
        value={
          <TransitionValue value={launchSummary.stats.altitude.toString()} />
        }
      />
    </div>
  );
}

const IndexPage: NextPage<IndexPageProps> = ({ launches }) => {
  const router = useRouter();
  const [selectedIndex, setIndex] = React.useState(2);
  const [selectedLaunch, setLaunch] = React.useState<LaunchSummary>(
    launches[2]
  );

  const mounted = useMounted();

  React.useEffect(() => {
    endPageTransition();
  }, []);

  return (
    <>
      <RenderHead launch={selectedLaunch} />
      <Header />
      <main className={styles.main}>
        <section className={styles.container}>
          <div className={styles.images}>
            <img
              alt="Inner"
              className={styles.inner}
              src="/images/outline.svg"
            />
            <img
              alt="Outer"
              className={styles.outer}
              src="/images/outline-outer.svg"
            />
            <div
              className={styles.background}
              style={{ backgroundImage: `url(${selectedLaunch.img})` }}
            />
            <div className={styles.shadow} />
            <hr className={styles.hr} />
          </div>

          <Stats launchSummary={selectedLaunch} />

          <div className={styles.dotContainer}>
            <div
              className={styles.dot}
              style={{
                transform: `rotate(${
                  180 + (75 / launches.length) * selectedIndex + 1.5
                }deg) translate(calc(32.5vh))`,
              }}
            />
          </div>

          <ul className={styles.launches}>
            {launches.map((launch, i) => {
              const isSelected = launch === selectedLaunch;
              return (
                <li
                  key={launch.name}
                  className={styles.launch}
                  data-selected={isSelected}
                  onClick={() => {
                    setIndex(i);
                    setLaunch(launch);
                  }}
                  style={{
                    transform: `rotate(${
                      180 + (75 / launches.length) * i
                    }deg) translate(45vh) rotate(180deg)`,
                  }}
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
          <Link href={"/" + selectedLaunch.name}>.</Link>
        </section>
      </main>

      <Social />
    </>
  );
};

export default IndexPage;
