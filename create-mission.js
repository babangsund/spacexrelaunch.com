const { add } = require("date-fns");
const fs = require("fs");

// Starlink 4-5

const liftoffTime = new Date("2022-01-06T09:49:00.000Z");

const stage1Positions = [];

const stage2Positions = [];

const mission = {
  liftoffTime,
  telemetry: {
    stage: {
      1: [
        { time: new Date(liftoffTime), altitude: 0.0, speed: 0 },
        { time: add(liftoffTime, { minutes: 0, seconds: 15 }), altitude: 0.2, speed: 164 },
        { time: add(liftoffTime, { minutes: 0, seconds: 30 }), altitude: 1.4, speed: 431 },
        { time: add(liftoffTime, { minutes: 0, seconds: 45 }), altitude: 3.9, speed: 776 },
        { time: add(liftoffTime, { minutes: 1, seconds: 0 }), altitude: 7.6, speed: 1099 },
        { time: add(liftoffTime, { minutes: 1, seconds: 15 }), altitude: 12.4, speed: 1631 },
        { time: add(liftoffTime, { minutes: 1, seconds: 30 }), altitude: 18.6, speed: 2306 },
        { time: add(liftoffTime, { minutes: 1, seconds: 45 }), altitude: 25.9, speed: 3185 },
        { time: add(liftoffTime, { minutes: 2, seconds: 0 }), altitude: 34.9, speed: 4270 },
        { time: add(liftoffTime, { minutes: 2, seconds: 15 }), altitude: 46.1, speed: 5617 },
        { time: add(liftoffTime, { minutes: 2, seconds: 30 }), altitude: 60.1, speed: 7224 },
        { time: add(liftoffTime, { minutes: 2, seconds: 45 }), altitude: 75.5, speed: 7740 },
        { time: add(liftoffTime, { minutes: 2, seconds: 52 }), altitude: 83.0, speed: 7619 },
        { time: add(liftoffTime, { minutes: 3, seconds: 0 }), altitude: 89.9, speed: 7508 },
        { time: add(liftoffTime, { minutes: 3, seconds: 15 }), altitude: 101, speed: 7314 },
        { time: add(liftoffTime, { minutes: 3, seconds: 30 }), altitude: 111, speed: 7143 },
        { time: add(liftoffTime, { minutes: 3, seconds: 45 }), altitude: 119, speed: 7003 },
        { time: add(liftoffTime, { minutes: 4, seconds: 0 }), altitude: 126, speed: 6894 },
        { time: add(liftoffTime, { minutes: 4, seconds: 15 }), altitude: 130, speed: 6820 },
        { time: add(liftoffTime, { minutes: 4, seconds: 30 }), altitude: 132, speed: 6779 },
        { time: add(liftoffTime, { minutes: 4, seconds: 45 }), altitude: 132, speed: 6774 },
        { time: add(liftoffTime, { minutes: 5, seconds: 0 }), altitude: 131, speed: 6803 },
        { time: add(liftoffTime, { minutes: 5, seconds: 15 }), altitude: 127, speed: 6866 },
        { time: add(liftoffTime, { minutes: 5, seconds: 30 }), altitude: 122, speed: 6962 },
        { time: add(liftoffTime, { minutes: 5, seconds: 45 }), altitude: 114, speed: 7092 },
        { time: add(liftoffTime, { minutes: 6, seconds: 0 }), altitude: 105, speed: 7253 },
        { time: add(liftoffTime, { minutes: 6, seconds: 15 }), altitude: 93.8, speed: 7443 },
        { time: add(liftoffTime, { minutes: 6, seconds: 30 }), altitude: 80.4, speed: 7661 },
        { time: add(liftoffTime, { minutes: 6, seconds: 45 }), altitude: 65.1, speed: 7901 },
        { time: add(liftoffTime, { minutes: 7, seconds: 0 }), altitude: 48.2, speed: 7397 },
        { time: add(liftoffTime, { minutes: 7, seconds: 15 }), altitude: 34.2, speed: 5696 },
        { time: add(liftoffTime, { minutes: 7, seconds: 30 }), altitude: 21.3, speed: 5079 },
        { time: add(liftoffTime, { minutes: 7, seconds: 45 }), altitude: 11.6, speed: 2614 },
        { time: add(liftoffTime, { minutes: 8, seconds: 0 }), altitude: 7.5, speed: 1343 },
        { time: add(liftoffTime, { minutes: 8, seconds: 15 }), altitude: 4.4, speed: 1034 },
        { time: add(liftoffTime, { minutes: 8, seconds: 30 }), altitude: 1.5, speed: 773 },
        { time: add(liftoffTime, { minutes: 8, seconds: 37 }), altitude: 0.5, speed: 435 },
        { time: add(liftoffTime, { minutes: 8, seconds: 45 }), altitude: 0.0, speed: 105 },
        { time: add(liftoffTime, { minutes: 8, seconds: 52 }), altitude: 0.0, speed: 0 },
      ],
      2: [
        // Ses-1
        // Second engine startup
        { time: add(liftoffTime, { minutes: 2, seconds: 52 }), altitude: 83.2, speed: 7780 },
        { time: add(liftoffTime, { minutes: 3, seconds: 0 }), altitude: 90.3, speed: 7876 },
        { time: add(liftoffTime, { minutes: 3, seconds: 15 }), altitude: 103, speed: 8102 },
        { time: add(liftoffTime, { minutes: 3, seconds: 30 }), altitude: 115, speed: 8355 },
        { time: add(liftoffTime, { minutes: 3, seconds: 45 }), altitude: 127, speed: 8620 },
        { time: add(liftoffTime, { minutes: 4, seconds: 0 }), altitude: 137, speed: 8902 },
        { time: add(liftoffTime, { minutes: 4, seconds: 15 }), altitude: 147, speed: 9218 },
        { time: add(liftoffTime, { minutes: 4, seconds: 30 }), altitude: 155, speed: 9575 },
        { time: add(liftoffTime, { minutes: 4, seconds: 45 }), altitude: 163, speed: 9968 },
        { time: add(liftoffTime, { minutes: 5, seconds: 0 }), altitude: 171, speed: 10409 },
        { time: add(liftoffTime, { minutes: 5, seconds: 15 }), altitude: 177, speed: 10891 },
        { time: add(liftoffTime, { minutes: 5, seconds: 30 }), altitude: 183, speed: 11422 },
        { time: add(liftoffTime, { minutes: 5, seconds: 45 }), altitude: 188, speed: 12008 },
        { time: add(liftoffTime, { minutes: 6, seconds: 0 }), altitude: 192, speed: 12645 },
        { time: add(liftoffTime, { minutes: 6, seconds: 15 }), altitude: 196, speed: 13334 },
        { time: add(liftoffTime, { minutes: 6, seconds: 30 }), altitude: 200, speed: 14091 },
        { time: add(liftoffTime, { minutes: 6, seconds: 45 }), altitude: 202, speed: 14915 },
        { time: add(liftoffTime, { minutes: 7, seconds: 0 }), altitude: 205, speed: 15817 },
        { time: add(liftoffTime, { minutes: 7, seconds: 15 }), altitude: 207, speed: 16811 },
        { time: add(liftoffTime, { minutes: 7, seconds: 30 }), altitude: 208, speed: 17898 },
        { time: add(liftoffTime, { minutes: 7, seconds: 45 }), altitude: 209, speed: 19121 },
        { time: add(liftoffTime, { minutes: 8, seconds: 0 }), altitude: 210, speed: 20450 },
        { time: add(liftoffTime, { minutes: 8, seconds: 15 }), altitude: 210, speed: 21914 },
        { time: add(liftoffTime, { minutes: 8, seconds: 30 }), altitude: 210, speed: 23538 },
        { time: add(liftoffTime, { minutes: 8, seconds: 45 }), altitude: 210, speed: 25393 },
        { time: add(liftoffTime, { minutes: 9, seconds: 0 }), altitude: 210, speed: 27147 },
      ],
    },
  },
  events: [
    { title: "LIFTOFF", time: new Date(liftoffTime) },
    { title: "MAX-Q", time: add(liftoffTime, { minutes: 1, seconds: 15 }) },
    { title: "MECO", time: add(liftoffTime, { minutes: 2, seconds: 19 }) },
    { title: "FAIRING", time: add(liftoffTime, { minutes: 3, seconds: 1 }) },
    { title: "ENTRY", time: add(liftoffTime, { minutes: 6, seconds: 56 }) },
    { title: "LANDING", time: add(liftoffTime, { minutes: 8, seconds: 34 }) },
    { title: "SECO-1", time: add(liftoffTime, { minutes: 8, seconds: 57 }), checkpoint: true },
    { title: "SES-2", time: add(liftoffTime, { minutes: 55, seconds: 21 }) },
    { title: "SECO-2", time: add(liftoffTime, { minutes: 55, seconds: 24 }) },
    { title: "DEPLOY", time: add(liftoffTime, { minutes: 59, seconds: 43 }) },
  ],
  notifications: [
    {
      time: new Date(liftoffTime),
      title: "LIFTOFF",
      description: "THE HOLDDOWN CLAMPS HAVE RELEASED FALCON 9 AND WE HAVE BEGUN OUR FLIGHT",
    },
    {
      title: "MAX-Q",
      time: add(liftoffTime, { minutes: 1, seconds: 15 }),
      description:
        "MAXIMUM DYNAMIC PRESSURE\nTHIS IS THE LARGEST AMOUNT OF STRESS EXERTED ON THE VEHICLE",
    },
    {
      title: "MECO",
      time: add(liftoffTime, { minutes: 2, seconds: 36 }),
      description: "Main engine cutoff",
    },
    {
      title: "Stage sep",
      time: add(liftoffTime, { minutes: 2, seconds: 41 }),
      description: "Stage 1 has separated from stage 2",
    },
    {
      title: "SES-1",
      time: add(liftoffTime, { minutes: 2, seconds: 47 }),
      description: "SECOND ENGINE STARTUP 1",
    },
  ],
};

mission.telemetry.stage[1].forEach((telemetry, index) => {
  telemetry.position = stage1Positions[index];
});

mission.telemetry.stage[2].forEach((telemetry, index) => {
  telemetry.position = stage2Positions[index];
});

fs.writeFile("./starlink_4-5.json", JSON.stringify(mission, null, 2), (err) => {
  if (err) {
    console.error(err);
    return;
  }
  //file written successfully
});
